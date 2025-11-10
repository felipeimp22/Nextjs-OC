'use server';

import prisma from "@/lib/prisma";
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import { calculateOrderDraft, OrderDraftInput, OrderItemInput } from '@/lib/utils/orderDraftCalculator';
import { convertPlatformFeeToLocal } from '@/lib/utils/currencyConverter';
import { revalidatePath } from 'next/cache';

interface CreateOrderInput {
  restaurantId: string;
  items: OrderItemInput[];
  orderType: 'pickup' | 'delivery' | 'dine_in';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: any;
  tip?: number;
  deliveryDistance?: number;
  customerLocation?: { lat: number; lng: number };
  specialInstructions?: string;
}

export async function createOrderDraft(input: CreateOrderInput) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: {
        financialSettings: true,
        deliverySettings: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: input.restaurantId,
        isAvailable: true,
        isVisible: true,
      },
    });

    const menuRules = await prisma.menuRules.findMany({
      where: { restaurantId: input.restaurantId },
    });

    const options = await prisma.option.findMany({
      where: {
        restaurantId: input.restaurantId,
        isAvailable: true,
      },
    });

    const menuItemsMap = new Map(menuItems.map(item => [item.id, {
      id: item.id,
      name: item.name,
      price: item.price,
    }]));

    const menuRulesMap = new Map(
      menuRules.map(rule => [rule.menuItemId, rule.appliedOptions as any[]])
    );

    const optionsMap = new Map(
      options.map(option => [option.id, {
        id: option.id,
        name: option.name,
        choices: option.choices as any[],
      }])
    );

    const draftInput: OrderDraftInput = {
      restaurantId: input.restaurantId,
      items: input.items,
      orderType: input.orderType,
      tip: input.tip,
      taxSettings: restaurant.financialSettings?.taxes as any[],
      deliveryPricingTiers: restaurant.deliverySettings?.pricingTiers as any[],
      globalFee: restaurant.financialSettings?.globalFee as any,
      distanceUnit: restaurant.deliverySettings?.distanceUnit as 'km' | 'miles' | undefined,
    };

    if (input.orderType === 'delivery' && input.customerLocation) {
      draftInput.restaurantLocation = {
        lat: restaurant.geoLat || 0,
        lng: restaurant.geoLng || 0,
      };
      draftInput.customerLocation = input.customerLocation;
      draftInput.deliveryDistance = input.deliveryDistance;
    }

    const orderDraft = await calculateOrderDraft(
      draftInput,
      menuItemsMap,
      menuRulesMap,
      optionsMap
    );

    const currency = restaurant.financialSettings?.currency || 'USD';
    const platformFeeInLocalCurrency = convertPlatformFeeToLocal(
      orderDraft.platformFee,
      currency
    );

    return {
      success: true,
      data: {
        ...orderDraft,
        platformFeeInLocalCurrency,
        currency,
        currencySymbol: restaurant.financialSettings?.currencySymbol || '$',
      },
    };
  } catch (error: any) {
    console.error('❌ Create order draft failed:', error);
    return { success: false, error: error.message };
  }
}

export async function createOrder(input: CreateOrderInput) {
  try {
    const draftResult = await createOrderDraft(input);

    if (!draftResult.success || !draftResult.data) {
      return { success: false, error: draftResult.error };
    }

    const orderDraft = draftResult.data;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: {
        financialSettings: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        restaurantId: input.restaurantId,
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress || {},
        restaurantInfo: {
          name: restaurant.name,
          phone: restaurant.phone,
          address: {
            street: restaurant.street,
            city: restaurant.city,
            state: restaurant.state,
            zipCode: restaurant.zipCode,
            country: restaurant.country,
          },
        },
        items: orderDraft.items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.finalPrice,
          quantity: item.quantity,
          options: item.options,
          specialInstructions: item.specialInstructions,
        })),
        orderType: input.orderType,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'card',
        subtotal: orderDraft.subtotal,
        tax: orderDraft.tax,
        taxBreakdown: orderDraft.taxBreakdown,
        tip: orderDraft.tip,
        deliveryFee: orderDraft.deliveryFee,
        platformFee: orderDraft.platformFee,
        total: orderDraft.total,
        deliveryDistance: input.deliveryDistance,
        specialInstructions: input.specialInstructions,
        timezone: 'America/New_York',
        localDate: new Date().toISOString().split('T')[0],
        localDateTime: new Date(),
      },
    });

    console.log(`✅ Order created: ${order.orderNumber}`);

    return { success: true, data: order };
  } catch (error: any) {
    console.error('❌ Create order failed:', error);
    return { success: false, error: error.message };
  }
}

export async function createPaymentIntent(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const financialSettings = await prisma.financialSettings.findUnique({
      where: { restaurantId: order.restaurantId },
    });

    if (!financialSettings) {
      return { success: false, error: 'Financial settings not found' };
    }

    const provider = await PaymentFactory.getProvider(
      financialSettings.paymentProvider || 'stripe'
    ) as StripePaymentProvider;

    const amountInCents = Math.round(order.total * 100);
    const platformFeeInCents = Math.round(order.platformFee * 100);

    const paymentIntentOptions: any = {
      amount: amountInCents,
      currency: financialSettings.currency?.toLowerCase() || 'usd',
      orderId: order.id,
      restaurantId: order.restaurantId,
      metadata: {
        order_id: order.id,
        restaurant_id: order.restaurantId,
        order_number: order.orderNumber,
      },
    };

    // Check if restaurant has Stripe Connect configured
    const hasStripeAccount = !!financialSettings.stripeAccountId;
    const isFullyConnected = financialSettings.stripeConnectStatus === 'connected';
    const isPending = financialSettings.stripeConnectStatus === 'pending';
    const connectedAccountPublicKey = financialSettings.stripePublicKey;

    if (hasStripeAccount && (isFullyConnected || isPending)) {
      // Use Stripe Connect - payments go to restaurant account with platform fee
      paymentIntentOptions.connectedAccountId = financialSettings.stripeAccountId;
      paymentIntentOptions.applicationFeeAmount = platformFeeInCents;

      if (!connectedAccountPublicKey) {
        console.error(`❌ Connected account missing publishable key for restaurant ${order.restaurantId}`);
        return {
          success: false,
          error: 'Restaurant payment configuration incomplete. Please reconnect Stripe account.',
        };
      }

      if (isPending) {
        console.warn(`⚠️ Using Stripe Connect with pending status for restaurant ${order.restaurantId} - Complete onboarding for full features`);
      } else {
        console.log(`💳 Using Stripe Connect for restaurant ${order.restaurantId}`);
      }
    } else if (financialSettings.usePlatformAccountFallback) {
      // Allow platform account fallback if explicitly enabled for testing
      console.warn(`⚠️ Using platform account fallback for restaurant ${order.restaurantId} - TESTING ONLY`);
    } else {
      // No Stripe Connect and fallback disabled - provide detailed error
      const statusMessage = hasStripeAccount
        ? `Stripe account status: ${financialSettings.stripeConnectStatus}. Please complete Stripe onboarding.`
        : 'No Stripe account connected. Please set up Stripe Connect in restaurant settings.';

      console.error(`❌ Payment blocked for restaurant ${order.restaurantId}:`, {
        hasAccountId: hasStripeAccount,
        status: financialSettings.stripeConnectStatus,
        fallbackEnabled: financialSettings.usePlatformAccountFallback,
      });

      return {
        success: false,
        error: `Restaurant payment account not set up. ${statusMessage}`,
      };
    }

    const paymentIntent = await provider.createPaymentIntent(paymentIntentOptions);

    // Use connected account's publishable key if available, otherwise platform key
    const publicKeyToUse = connectedAccountPublicKey || paymentIntent.publicKey;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentIntent.paymentIntentId,
        paymentClientSecret: paymentIntent.clientSecret,
      },
    });

    console.log(`✅ Payment intent created for order ${order.orderNumber}`, {
      paymentIntentId: paymentIntent.paymentIntentId,
      accountType: paymentIntent.accountType,
      hasClientSecret: !!paymentIntent.clientSecret,
      hasPublicKey: !!publicKeyToUse,
      publicKeyPrefix: publicKeyToUse?.substring(0, 20),
      usingConnectedAccountKey: !!connectedAccountPublicKey,
    });

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.clientSecret,
        publicKey: publicKeyToUse,
        accountType: paymentIntent.accountType,
      },
    };
  } catch (error: any) {
    console.error('❌ Create payment intent failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getPublicRestaurantData(restaurantId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menuCategories: {
          orderBy: { order: 'asc' },
        },
        menuItems: {
          where: {
            isAvailable: true,
            isVisible: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        options: {
          where: {
            isAvailable: true,
            isVisible: true,
          },
        },
        menuRules: true,
        financialSettings: true,
        deliverySettings: true,
        storeHours: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const publicData = {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      address: {
        street: restaurant.street,
        city: restaurant.city,
        state: restaurant.state,
        zipCode: restaurant.zipCode,
        country: restaurant.country,
      },
      phone: restaurant.phone,
      email: restaurant.email,
      logo: restaurant.logo,
      colors: {
        primary: restaurant.primaryColor,
        secondary: restaurant.secondaryColor,
        accent: restaurant.accentColor,
      },
      categories: restaurant.menuCategories,
      items: restaurant.menuItems,
      options: restaurant.options,
      menuRules: restaurant.menuRules,
      currency: restaurant.financialSettings?.currency || 'USD',
      currencySymbol: restaurant.financialSettings?.currencySymbol || '$',
      deliveryEnabled: restaurant.deliverySettings?.enabled || false,
      storeHours: restaurant.storeHours,
    };

    return { success: true, data: publicData };
  } catch (error: any) {
    console.error('❌ Get public restaurant data failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, data: order };
  } catch (error: any) {
    console.error('❌ Get order failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrderByPaymentIntent(paymentIntentId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { paymentIntentId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, data: order };
  } catch (error: any) {
    console.error('❌ Get order by payment intent failed:', error);
    return { success: false, error: error.message };
  }
}
