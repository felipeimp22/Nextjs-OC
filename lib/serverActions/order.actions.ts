'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
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
    const deliveryFeeInCents = Math.round((order.deliveryFee || 0) * 100);

    // Check if this is a Shipday delivery
    const deliveryInfo = order.deliveryInfo as any;
    const isShipdayDelivery = deliveryInfo?.provider === 'shipday';

    const paymentIntentOptions: any = {
      amount: amountInCents,
      currency: financialSettings.currency?.toLowerCase() || 'usd',
      orderId: order.id,
      restaurantId: order.restaurantId,
      metadata: {
        order_id: order.id,
        restaurant_id: order.restaurantId,
        order_number: order.orderNumber,
        delivery_provider: deliveryInfo?.provider || 'none',
      },
    };

    // Check if restaurant has Stripe Connect configured
    const hasStripeAccount = !!financialSettings.stripeAccountId;
    const isFullyConnected = financialSettings.stripeConnectStatus === 'connected';
    const isPending = financialSettings.stripeConnectStatus === 'pending';
    let connectedAccountPublicKey = financialSettings.stripePublicKey;

    if (hasStripeAccount && (isFullyConnected || isPending)) {
      // Use Stripe Connect - payments go to restaurant account with platform fee
      paymentIntentOptions.connectedAccountId = financialSettings.stripeAccountId;

      // Calculate application fee based on delivery provider
      // For Shipday deliveries: Platform collects both platform fee AND delivery fee (to pay Shipday)
      // For local deliveries: Platform collects only platform fee (restaurant keeps delivery fee)
      let applicationFeeAmount = platformFeeInCents;

      if (isShipdayDelivery && deliveryFeeInCents > 0) {
        applicationFeeAmount = platformFeeInCents + deliveryFeeInCents;
        console.log(`💰 Shipday delivery detected - Platform collecting delivery fee`);
        console.log(`   Platform Fee: $${order.platformFee.toFixed(2)}`);
        console.log(`   Delivery Fee: $${order.deliveryFee.toFixed(2)}`);
        console.log(`   Total Application Fee: $${(applicationFeeAmount / 100).toFixed(2)}`);
      } else if (deliveryFeeInCents > 0) {
        console.log(`💰 Local delivery - Restaurant keeps delivery fee of $${order.deliveryFee.toFixed(2)}`);
      }

      paymentIntentOptions.applicationFeeAmount = applicationFeeAmount;

      // If publishable key is missing, fetch it from Stripe and save it
      if (!connectedAccountPublicKey) {
        console.warn(`⚠️ Missing publishable key for connected account, fetching from Stripe...`);
        try {
          const account = await provider.getConnectedAccount(financialSettings.stripeAccountId!);

          // For Express/Standard accounts, we need to use platform's key with the account ID
          // The publishable key is the same as platform, client secret is what's scoped
          connectedAccountPublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

          if (connectedAccountPublicKey) {
            // Save it for next time
            await prisma.financialSettings.update({
              where: { restaurantId: order.restaurantId },
              data: { stripePublicKey: connectedAccountPublicKey },
            });
            console.log(`✅ Saved publishable key for restaurant ${order.restaurantId}`);
          }
        } catch (error: any) {
          console.error(`❌ Failed to fetch account details:`, error.message);
        }
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
        stripeAccountId: financialSettings.stripeAccountId || undefined, // Pass connected account ID
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

interface GetOrdersFilters {
  status?: string;
  orderType?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

function getTimezoneOffsetMinutes(timezone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  const minute = Number(parts.find(p => p.type === 'minute')?.value);
  const second = Number(parts.find(p => p.type === 'second')?.value);

  const localTime = new Date(year, month - 1, day, hour, minute, second);
  const diff = date.getTime() - localTime.getTime();

  return Math.round(diff / 60000);
}

function convertLocalDateToUTC(dateString: string, timezone: string, isEndOfDay: boolean = false): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  const hours = isEndOfDay ? 23 : 0;
  const minutes = isEndOfDay ? 59 : 0;
  const seconds = isEndOfDay ? 59 : 0;
  const milliseconds = isEndOfDay ? 999 : 0;

  const referenceUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const offsetMinutes = getTimezoneOffsetMinutes(timezone, referenceUTC);

  const localDateUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds));

  return new Date(localDateUTC.getTime() + offsetMinutes * 60000);
}

export async function getOrders(restaurantId: string, filters?: GetOrdersFilters) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const where: {
      restaurantId: string;
      status?: string;
      orderType?: string;
      paymentStatus?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      restaurantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.orderType) {
      where.orderType = filters.orderType;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      const storeHours = await prisma.storeHours.findUnique({
        where: { restaurantId },
        select: { timezone: true },
      });

      const timezone = storeHours?.timezone || 'America/New_York';

      where.createdAt = {};

      if (filters.dateFrom) {
        where.createdAt.gte = convertLocalDateToUTC(filters.dateFrom, timezone, false);
      }

      if (filters.dateTo) {
        where.createdAt.lte = convertLocalDateToUTC(filters.dateTo, timezone, true);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: orders, error: null };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: 'Failed to fetch orders', data: null };
  }
}
