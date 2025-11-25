'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import { calculateOrderDraft, OrderDraftInput, OrderItemInput } from '@/lib/utils/orderDraftCalculator';
import { convertPlatformFeeToLocal } from '@/lib/utils/currencyConverter';
import { revalidatePath } from 'next/cache';
import { calculateTaxes, TaxSetting, TaxCalculationItem } from '@/lib/utils/taxCalculator';
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';
import { calculateDeliveryFee, DeliverySettings } from '@/lib/utils/deliveryFeeCalculator';
import { DeliveryFactory } from '@/lib/delivery/DeliveryFactory';
import { findOrCreateCustomer, addOrderToCustomerHistory, updateCustomerStats, handleOrderPaymentChange } from '@/lib/serverActions/customer.actions';

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
        storeHours: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    // Get restaurant timezone from StoreHours
    const restaurantTimezone = restaurant.storeHours?.timezone || 'UTC';

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
        timezone: restaurantTimezone,
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

// ========================================
// IN-HOUSE ORDER OPERATIONS (moved from kitchen.actions.ts)
// ========================================

interface CreateInHouseOrderInput {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price?: number;
    options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
    specialInstructions?: string;
  }>;
  orderType: 'pickup' | 'delivery' | 'dine_in';
  deliveryAddress?: string;
  deliveryCoordinates?: {
    latitude: number;
    longitude: number;
  };
  paymentStatus: 'pending' | 'paid';
  paymentMethod: 'card' | 'cash' | 'other';
  specialInstructions?: string;
  prepTime?: number;
  scheduledPickupTime?: string;
  driverTip?: number;
}

interface UpdateInHouseOrderInput extends CreateInHouseOrderInput {
  orderId: string;
}

/**
 * Calculate delivery fee estimate for order preview
 * Called by OrderModal to show delivery fee before order submission
 */
export async function calculateDeliveryFeeEstimate(
  restaurantId: string,
  deliveryAddress: string,
  deliveryCoordinates?: { latitude: number; longitude: number },
  customerName?: string,
  customerPhone?: string,
  orderValue?: number
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        deliverySettings: true,
        financialSettings: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found', deliveryFee: 0 };
    }

    if (!restaurant.deliverySettings) {
      return { success: false, error: 'Delivery not configured', deliveryFee: 0 };
    }

    const deliverySettings = restaurant.deliverySettings as unknown as DeliverySettings;
    const restaurantAddress = `${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}`;
    const currencySymbol = restaurant.financialSettings?.currencySymbol || '$';

    // Shipday needs ADDRESS STRING, local can use coordinates for optimization
    const deliveryAddressOrCoords =
      deliverySettings.driverProvider === 'shipday'
        ? deliveryAddress
        : (deliveryCoordinates
            ? { longitude: deliveryCoordinates.longitude, latitude: deliveryCoordinates.latitude }
            : deliveryAddress);

    const deliveryResult = await calculateDeliveryFee(
      restaurantAddress,
      deliveryAddressOrCoords,
      deliverySettings,
      currencySymbol as string,
      restaurant.name,
      customerName,
      customerPhone,
      orderValue
    );

    if (deliveryResult.error) {
      return {
        success: false,
        error: deliveryResult.error,
        deliveryFee: 0,
      };
    }

    return {
      success: true,
      deliveryFee: deliveryResult.deliveryFee,
      distance: deliveryResult.distance,
      distanceUnit: deliveryResult.distanceUnit,
      provider: deliveryResult.provider,
      withinRadius: deliveryResult.withinRadius,
    };
  } catch (error: any) {
    console.error('❌ Delivery fee estimate error:', error);
    return {
      success: false,
      error: error.message,
      deliveryFee: 0,
    };
  }
}
export async function createInHouseOrder(input: CreateInHouseOrderInput) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: {
        financialSettings: true,
        deliverySettings: true,
        storeHours: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    // Get restaurant timezone from StoreHours
    const restaurantTimezone = restaurant.storeHours?.timezone || 'UTC';

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: input.items.map(item => item.menuItemId) },
        restaurantId: input.restaurantId,
      },
    });

    const menuItemsMap = new Map<string, typeof menuItems[0]>(menuItems.map(item => [item.id, item]));

    let subtotal = 0;
    const orderItems = input.items.map(item => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }

      let itemPrice: number;
      if (item.price !== undefined && item.price !== null) {
        itemPrice = item.price;
      } else {
        itemPrice = Number(menuItem.price);
        if (item.options) {
          item.options.forEach(option => {
            itemPrice += option.priceAdjustment;
          });
        }
      }

      const finalPrice = itemPrice * item.quantity;
      subtotal += finalPrice;

      return {
        menuItemId: item.menuItemId,
        name: String(menuItem.name),
        price: itemPrice,
        quantity: item.quantity,
        options: item.options || [],
        specialInstructions: item.specialInstructions,
      };
    });

    // ========================================
    // CALCULATE TAXES (using centralized utility)
    // ========================================
    console.log('=== TAX CALCULATION (createInHouseOrder) ===');
    console.log('Using centralized taxCalculator utility');

    const taxSettings = (restaurant.financialSettings?.taxes as TaxSetting[]) || [];
    const taxCalculationItems: TaxCalculationItem[] = orderItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));

    const taxResult = calculateTaxes(subtotal, taxCalculationItems, taxSettings);
    const tax = taxResult.totalTax;
    const taxBreakdown = taxResult.breakdown;

    console.log('Tax calculation result:', {
      subtotal: `$${subtotal.toFixed(2)}`,
      tax: `$${tax.toFixed(2)}`,
      breakdown: taxBreakdown,
    });

    // ========================================
    // CALCULATE GLOBAL FEE (using centralized utility)
    // ========================================
    console.log('=== GLOBAL FEE CALCULATION (createInHouseOrder) ===');
    console.log('Using centralized feeCalculator utility');

    const globalFeeSettings = restaurant.financialSettings?.globalFee as GlobalFeeSettings;
    const feeResult = calculateGlobalFee(subtotal, globalFeeSettings);
    const platformFee = feeResult.platformFee;

    console.log('Fee calculation result:', {
      platformFee: `$${platformFee.toFixed(2)}`,
      appliedRule: feeResult.appliedRule,
    });

    // ========================================
    // CALCULATE DELIVERY FEE (using centralized utility)
    // ========================================
    let deliveryFee = 0;
    let deliveryFeeDetails: any = null;

    if (input.orderType === 'delivery') {
      console.log('=== DELIVERY FEE CALCULATION (createInHouseOrder) ===');
      console.log('Using centralized deliveryFeeCalculator utility');

      if (!input.deliveryAddress) {
        console.error('❌ Delivery address is required for delivery orders');
        return { success: false, error: 'Delivery address is required for delivery orders' };
      }

      if (restaurant.deliverySettings) {
        const deliverySettings = restaurant.deliverySettings as unknown as DeliverySettings;
        const restaurantAddress = `${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}`;
        const currencySymbol = restaurant.financialSettings?.currencySymbol || '$';

        // IMPORTANT: Shipday needs ADDRESS STRING, not coordinates
        // Local delivery can use coordinates to optimize (skip geocoding)
        const deliveryAddressOrCoords =
          deliverySettings.driverProvider === 'shipday'
            ? input.deliveryAddress!  // Shipday MUST have address string
            : (input.deliveryCoordinates
                ? { longitude: input.deliveryCoordinates.longitude, latitude: input.deliveryCoordinates.latitude }
                : input.deliveryAddress!);

        const deliveryResult = await calculateDeliveryFee(
          restaurantAddress,
          deliveryAddressOrCoords,
          deliverySettings,
          currencySymbol as string,
          restaurant.name,
          input.customerName,
          input.customerPhone,
          subtotal + tax + platformFee
        );

        if (deliveryResult.error) {
          console.error('❌ Delivery fee calculation error:', deliveryResult.error);
          return { success: false, error: deliveryResult.error };
        }

        deliveryFee = deliveryResult.deliveryFee;
        deliveryFeeDetails = {
          distance: deliveryResult.distance,
          distanceUnit: deliveryResult.distanceUnit,
          provider: deliveryResult.provider,
          tierUsed: deliveryResult.tierUsed,
          calculationDetails: deliveryResult.calculationDetails,
        };

        console.log('Delivery fee calculation result:', {
          deliveryFee: `$${deliveryFee.toFixed(2)}`,
          distance: `${deliveryResult.distance} ${deliveryResult.distanceUnit}`,
          provider: deliveryResult.provider,
        });
      } else {
        console.warn('⚠️ Delivery settings not configured for this restaurant');
        return { success: false, error: 'Delivery is not enabled for this restaurant' };
      }
    }

    const driverTip = input.driverTip || 0;
    const total = subtotal + tax + platformFee + deliveryFee + driverTip;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        restaurantId: input.restaurantId,
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerAddress: input.deliveryAddress ? { address: input.deliveryAddress } : {},
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
        items: orderItems,
        orderType: input.orderType,
        status: 'confirmed',
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        subtotal,
        tax,
        taxBreakdown,
        tip: 0,
        driverTip,
        deliveryFee,
        deliveryDistance: deliveryFeeDetails?.distance || null,
        deliveryInfo: deliveryFeeDetails || null,
        platformFee,
        total,
        specialInstructions: input.specialInstructions,
        prepTime: input.prepTime || null,
        scheduledPickupTime: input.scheduledPickupTime ? new Date(input.scheduledPickupTime) : null,
        timezone: restaurantTimezone,
        localDate: new Date().toISOString().split('T')[0],
        localDateTime: new Date(),
      },
    });

    // ========================================
    // CUSTOMER MANAGEMENT: Create/update customer record
    // ========================================
    try {
      console.log('=== CUSTOMER MANAGEMENT (createInHouseOrder) ===');

      const customerResult = await findOrCreateCustomer(
        input.customerEmail,
        input.customerName,
        input.customerPhone,
        input.restaurantId
      );

      if (customerResult.success && customerResult.data) {
        const customer = customerResult.data;

        await addOrderToCustomerHistory(customer.id, order.id);

        const isPaid = input.paymentStatus === 'paid';
        await updateCustomerStats(customer.id, total, isPaid, true);

        console.log(`✅ Customer ${customer.email} updated with order ${order.orderNumber}`);
      } else {
        console.error('❌ Failed to create/update customer:', customerResult.error);
      }
    } catch (customerError: any) {
      console.error('❌ Customer management error:', customerError.message);
    }

    // ========================================
    // SHIPDAY INTEGRATION: Create delivery if using Shipday
    // ========================================
    if (input.orderType === 'delivery' && deliveryFeeDetails?.provider === 'shipday') {
      console.log('=== SHIPDAY DELIVERY CREATION ===');
      console.log('🔍 Shipday Input Data:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: input.customerName,
        deliveryAddress: input.deliveryAddress,
        deliveryCoordinates: input.deliveryCoordinates,
        restaurantAddress: `${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}`,
        restaurantCoords: { lat: restaurant.geoLat, lng: restaurant.geoLng },
        prepTime: input.prepTime,
        scheduledPickupTime: order.scheduledPickupTime,
        orderValue: subtotal,
        tax,
        deliveryFee,
        driverTip,
        paymentMethod: input.paymentMethod,
      });

      try {
        const provider = await DeliveryFactory.getProvider('shipday');

        const shipdayResult = await provider.createDelivery({
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantName: restaurant.name,
          restaurantPhone: restaurant.phone,
          pickupAddress: {
            street: restaurant.street,
            city: restaurant.city,
            state: restaurant.state,
            zipCode: restaurant.zipCode,
            country: restaurant.country || 'US',
            latitude: restaurant.geoLat || undefined,
            longitude: restaurant.geoLng || undefined,
          },
          deliveryAddress: {
            street: input.deliveryAddress || '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            latitude: input.deliveryCoordinates?.latitude,
            longitude: input.deliveryCoordinates?.longitude,
          },
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          orderValue: subtotal,
          tax,
          deliveryFee,
          tip: driverTip,
          discountAmount: 0,
          paymentMethod: input.paymentMethod,
          items: orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
          })),
          specialInstructions: input.specialInstructions,
          scheduledTime: order.scheduledPickupTime || undefined,
        });

        // Update order with Shipday delivery info
        await prisma.order.update({
          where: { id: order.id },
          data: {
            deliveryInfo: {
              ...deliveryFeeDetails,
              externalId: shipdayResult.externalId,
              trackingUrl: shipdayResult.trackingUrl,
              status: shipdayResult.status,
            },
          },
        });

        console.log('✅ Shipday delivery created:', {
          externalId: shipdayResult.externalId,
          trackingUrl: shipdayResult.trackingUrl,
        });
      } catch (shipdayError: any) {
        console.error('❌ Failed to create Shipday delivery:', shipdayError.message);
        // Don't fail the whole order, but log the error
        // Order is still created, but delivery dispatch failed
      }
    }

    // ========================================
    // PLATFORM RECEIVABLE: Track what restaurant owes platform
    // ========================================
    try {
      const isShipdayDelivery = input.orderType === 'delivery' && deliveryFeeDetails?.provider === 'shipday';

      // Calculate what restaurant owes platform
      let platformReceivableAmount = platformFee;
      let receivableDeliveryFee = 0;
      let receivableDriverTip = 0;

      if (isShipdayDelivery) {
        // For Shipday deliveries, platform collects delivery fee and driver tip to pay Shipday
        receivableDeliveryFee = deliveryFee;
        receivableDriverTip = driverTip;
        platformReceivableAmount += deliveryFee + driverTip;
      }

      await prisma.platformReceivable.create({
        data: {
          restaurantId: input.restaurantId,
          orderId: order.id,
          platformFee,
          deliveryFee: receivableDeliveryFee,
          driverTip: receivableDriverTip,
          totalOwed: platformReceivableAmount,
          remainingBalance: platformReceivableAmount,
          status: 'pending',
          orderType: input.orderType,
          deliveryProvider: isShipdayDelivery ? 'shipday' : null,
        },
      });

      console.log('✅ Platform receivable created:', {
        orderId: order.id,
        totalOwed: `$${platformReceivableAmount.toFixed(2)}`,
        breakdown: {
          platformFee: `$${platformFee.toFixed(2)}`,
          deliveryFee: `$${receivableDeliveryFee.toFixed(2)}`,
          driverTip: `$${receivableDriverTip.toFixed(2)}`,
        },
      });
    } catch (receivableError: any) {
      console.error('❌ Failed to create platform receivable:', receivableError.message);
      // Don't fail the order if receivable creation fails
    }

    revalidatePath(`/${input.restaurantId}/kitchen`);
    revalidatePath(`/${input.restaurantId}/orders`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error creating in-house order:', error);
    return { success: false, error: error.message };
  }
}
export async function updateInHouseOrder(input: UpdateInHouseOrderInput) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!existingOrder) {
      return { success: false, error: 'Order not found' };
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: {
        financialSettings: true,
        deliverySettings: true,
        storeHours: true,
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    // Get restaurant timezone from StoreHours
    const restaurantTimezone = restaurant.storeHours?.timezone || 'UTC';

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: input.items.map(item => item.menuItemId) },
        restaurantId: input.restaurantId,
      },
    });

    const menuItemsMap = new Map<string, typeof menuItems[0]>(menuItems.map(item => [item.id, item]));

    let subtotal = 0;
    const orderItems = input.items.map(item => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }

      let itemPrice: number;
      if (item.price !== undefined && item.price !== null) {
        itemPrice = item.price;
      } else {
        itemPrice = Number(menuItem.price);
        if (item.options) {
          item.options.forEach(option => {
            itemPrice += option.priceAdjustment;
          });
        }
      }

      const finalPrice = itemPrice * item.quantity;
      subtotal += finalPrice;

      return {
        menuItemId: item.menuItemId,
        name: String(menuItem.name),
        price: itemPrice,
        quantity: item.quantity,
        options: item.options || [],
        specialInstructions: item.specialInstructions,
      };
    });

    // ========================================
    // CALCULATE TAXES (using centralized utility)
    // ========================================
    console.log('=== TAX CALCULATION (updateInHouseOrder) ===');
    console.log('Using centralized taxCalculator utility');

    const taxSettings = (restaurant.financialSettings?.taxes as TaxSetting[]) || [];
    const taxCalculationItems: TaxCalculationItem[] = orderItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));

    const taxResult = calculateTaxes(subtotal, taxCalculationItems, taxSettings);
    const tax = taxResult.totalTax;
    const taxBreakdown = taxResult.breakdown;

    console.log('Tax calculation result:', {
      subtotal: `$${subtotal.toFixed(2)}`,
      tax: `$${tax.toFixed(2)}`,
      breakdown: taxBreakdown,
    });

    // ========================================
    // CALCULATE GLOBAL FEE (using centralized utility)
    // ========================================
    console.log('=== GLOBAL FEE CALCULATION (updateInHouseOrder) ===');
    console.log('Using centralized feeCalculator utility');

    const globalFeeSettings = restaurant.financialSettings?.globalFee as GlobalFeeSettings;
    const feeResult = calculateGlobalFee(subtotal, globalFeeSettings);
    const platformFee = feeResult.platformFee;

    console.log('Fee calculation result:', {
      platformFee: `$${platformFee.toFixed(2)}`,
      appliedRule: feeResult.appliedRule,
    });

    // ========================================
    // CALCULATE DELIVERY FEE (using centralized utility)
    // ========================================
    let deliveryFee = 0;
    let deliveryFeeDetails: any = null;

    if (input.orderType === 'delivery') {
      console.log('=== DELIVERY FEE CALCULATION (updateInHouseOrder) ===');
      console.log('Using centralized deliveryFeeCalculator utility');

      if (!input.deliveryAddress) {
        console.error('❌ Delivery address is required for delivery orders');
        return { success: false, error: 'Delivery address is required for delivery orders' };
      }

      if (restaurant.deliverySettings) {
        const deliverySettings = restaurant.deliverySettings as unknown as DeliverySettings;
        const restaurantAddress = `${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}`;
        const currencySymbol = restaurant.financialSettings?.currencySymbol || '$';

        // IMPORTANT: Shipday needs ADDRESS STRING, not coordinates
        // Local delivery can use coordinates to optimize (skip geocoding)
        const deliveryAddressOrCoords =
          deliverySettings.driverProvider === 'shipday'
            ? input.deliveryAddress!  // Shipday MUST have address string
            : (input.deliveryCoordinates
                ? { longitude: input.deliveryCoordinates.longitude, latitude: input.deliveryCoordinates.latitude }
                : input.deliveryAddress!);

        const deliveryResult = await calculateDeliveryFee(
          restaurantAddress,
          deliveryAddressOrCoords,
          deliverySettings,
          currencySymbol as string,
          restaurant.name,
          input.customerName,
          input.customerPhone,
          subtotal + tax + platformFee
        );

        if (deliveryResult.error) {
          console.error('❌ Delivery fee calculation error:', deliveryResult.error);
          return { success: false, error: deliveryResult.error };
        }

        deliveryFee = deliveryResult.deliveryFee;
        deliveryFeeDetails = {
          distance: deliveryResult.distance,
          distanceUnit: deliveryResult.distanceUnit,
          provider: deliveryResult.provider,
          tierUsed: deliveryResult.tierUsed,
          calculationDetails: deliveryResult.calculationDetails,
        };

        console.log('Delivery fee calculation result:', {
          deliveryFee: `$${deliveryFee.toFixed(2)}`,
          distance: `${deliveryResult.distance} ${deliveryResult.distanceUnit}`,
          provider: deliveryResult.provider,
        });
      } else {
        console.warn('⚠️ Delivery settings not configured for this restaurant');
        return { success: false, error: 'Delivery is not enabled for this restaurant' };
      }
    }

    const total = subtotal + tax + platformFee + deliveryFee;

    const order = await prisma.order.update({
      where: { id: input.orderId },
      data: {
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerAddress: input.deliveryAddress ? { address: input.deliveryAddress } : {},
        items: orderItems,
        orderType: input.orderType,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        subtotal,
        tax,
        taxBreakdown,
        deliveryFee,
        deliveryDistance: deliveryFeeDetails?.distance || null,
        deliveryInfo: deliveryFeeDetails || null,
        platformFee,
        total,
        specialInstructions: input.specialInstructions,
        timezone: restaurantTimezone,
        localDate: new Date().toISOString().split('T')[0],
        localDateTime: new Date(),
      },
    });

    // ========================================
    // CUSTOMER MANAGEMENT: Handle payment status changes
    // ========================================
    try {
      console.log('=== CUSTOMER MANAGEMENT (updateInHouseOrder) ===');

      const oldPaymentStatus = existingOrder.paymentStatus;
      const newPaymentStatus = input.paymentStatus;

      if (oldPaymentStatus !== newPaymentStatus) {
        const customerResult = await findOrCreateCustomer(
          input.customerEmail,
          input.customerName,
          input.customerPhone,
          input.restaurantId
        );

        if (customerResult.success && customerResult.data) {
          const customer = customerResult.data;

          await handleOrderPaymentChange(
            order.id,
            oldPaymentStatus,
            newPaymentStatus,
            total,
            customer.id
          );

          console.log(`✅ Customer stats updated for payment status change: ${oldPaymentStatus} → ${newPaymentStatus}`);
        } else {
          console.error('❌ Failed to find/create customer for payment update:', customerResult.error);
        }
      } else {
        console.log('⏭️ No payment status change detected, skipping customer stats update');
      }
    } catch (customerError: any) {
      console.error('❌ Customer management error:', customerError.message);
    }

    revalidatePath(`/${input.restaurantId}/kitchen`);
    revalidatePath(`/${input.restaurantId}/orders`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error updating in-house order:', error);
    return { success: false, error: error.message };
  }
}
