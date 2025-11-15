'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateTaxes, TaxSetting, TaxCalculationItem } from '@/lib/utils/taxCalculator';
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';
import { calculateDeliveryFee, DeliverySettings } from '@/lib/utils/deliveryFeeCalculator';

// Diagnostic function to check tax configuration
export async function checkTaxConfiguration(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { financialSettings: true },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const taxes = (restaurant.financialSettings?.taxes as any[]) || [];
    const enabledTaxes = taxes.filter((t: any) => t.enabled);

    return {
      success: true,
      data: {
        hasFinancialSettings: !!restaurant.financialSettings,
        totalTaxes: taxes.length,
        enabledTaxes: enabledTaxes.length,
        taxes: taxes,
        message: taxes.length === 0
          ? 'No taxes configured. Go to Settings → Financial to add taxes.'
          : enabledTaxes.length === 0
          ? `${taxes.length} tax(es) configured but all are disabled. Enable them in Settings → Financial.`
          : `${enabledTaxes.length} tax(es) enabled and ready to use.`
      }
    };
  } catch (error: any) {
    console.error('Error checking tax configuration:', error);
    return { success: false, error: error.message };
  }
}

const DEFAULT_STAGES = [
  { status: 'pending', displayName: 'Pending', color: '#EAB308', order: 0 },
  { status: 'confirmed', displayName: 'Confirmed', color: '#3B82F6', order: 1 },
  { status: 'preparing', displayName: 'Preparing', color: '#8B5CF6', order: 2 },
  { status: 'ready', displayName: 'Ready', color: '#10B981', order: 3 },
  { status: 'out_for_delivery', displayName: 'Out for Delivery', color: '#F59E0B', order: 4 },
  { status: 'delivered', displayName: 'Delivered', color: '#059669', order: 5 },
  { status: 'completed', displayName: 'Completed', color: '#22C55E', order: 6 },
];

export async function getKitchenStages(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    let stages = await prisma.kitchenStage.findMany({
      where: { restaurantId },
      orderBy: { order: 'asc' },
    });

    if (stages.length === 0) {
      const createdStages = await Promise.all(
        DEFAULT_STAGES.map(stage =>
          prisma.kitchenStage.create({
            data: {
              restaurantId,
              ...stage,
              isEnabled: true,
            },
          })
        )
      );
      stages = createdStages;
    }

    return { success: true, data: stages, error: null };
  } catch (error: any) {
    console.error('Error fetching kitchen stages:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updateKitchenStages(restaurantId: string, stages: Array<{ status: string; isEnabled: boolean }>) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    await Promise.all(
      stages.map(stage =>
        prisma.kitchenStage.updateMany({
          where: {
            restaurantId,
            status: stage.status,
          },
          data: {
            isEnabled: stage.isEnabled,
          },
        })
      )
    );

    revalidatePath(`/${restaurantId}/kitchen`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating kitchen stages:', error);
    return { success: false, error: error.message };
  }
}

export async function getKitchenOrders(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          notIn: ['delivered', 'completed', 'cancelled'],
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return { success: true, data: orders, error: null };
  } catch (error: any) {
    console.error('Error fetching kitchen orders:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath(`/${order.restaurantId}/kitchen`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderPriority(orderId: string, priority: number) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { priority },
    });

    revalidatePath(`/${order.restaurantId}/kitchen`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error updating order priority:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrdersBatch(updates: Array<{ id: string; status?: string; priority?: number }>) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    await Promise.all(
      updates.map(update =>
        prisma.order.update({
          where: { id: update.id },
          data: {
            ...(update.status && { status: update.status }),
            ...(update.priority !== undefined && { priority: update.priority }),
          },
        })
      )
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error updating orders batch:', error);
    return { success: false, error: error.message };
  }
}

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
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

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

    const total = subtotal + tax + platformFee + deliveryFee;

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
        deliveryFee,
        deliveryFeeDetails,
        platformFee,
        total,
        specialInstructions: input.specialInstructions,
        timezone: 'America/New_York',
        localDate: new Date().toISOString().split('T')[0],
        localDateTime: new Date(),
      },
    });

    revalidatePath(`/${input.restaurantId}/kitchen`);
    revalidatePath(`/${input.restaurantId}/orders`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error creating in-house order:', error);
    return { success: false, error: error.message };
  }
}

interface UpdateInHouseOrderInput extends CreateInHouseOrderInput {
  orderId: string;
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
      },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

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
        deliveryFeeDetails,
        platformFee,
        total,
        specialInstructions: input.specialInstructions,
      },
    });

    revalidatePath(`/${input.restaurantId}/kitchen`);
    revalidatePath(`/${input.restaurantId}/orders`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error updating in-house order:', error);
    return { success: false, error: error.message };
  }
}
