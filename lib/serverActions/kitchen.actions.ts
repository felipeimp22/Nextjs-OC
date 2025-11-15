'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
      include: { financialSettings: true },
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

    const taxes = (restaurant.financialSettings?.taxes as any[]) || [];
    let tax = 0;
    const taxBreakdown: any[] = [];

    console.log('=== TAX CALCULATION DEBUG (createInHouseOrder) ===');
    console.log('Restaurant ID:', input.restaurantId);
    console.log('Financial Settings exist?', !!restaurant.financialSettings);
    console.log('Taxes from DB:', taxes);
    console.log('Taxes length:', taxes.length);
    console.log('Subtotal for tax calculation:', subtotal);

    taxes.forEach((taxSetting: any) => {
      console.log('Processing tax:', taxSetting.name, 'enabled:', taxSetting.enabled, 'type:', taxSetting.type, 'rate:', taxSetting.rate, 'applyTo:', taxSetting.applyTo);

      if (!taxSetting.enabled) {
        console.log(`Tax skipped (disabled): ${taxSetting.name}`);
        return;
      }

      let taxAmount = 0;

      if (taxSetting.applyTo === 'per_item') {
        // Apply tax per item
        orderItems.forEach((item) => {
          const itemTotal = item.price * item.quantity;

          if (taxSetting.type === 'percentage') {
            taxAmount += (itemTotal * taxSetting.rate) / 100;
          } else if (taxSetting.type === 'fixed') {
            taxAmount += taxSetting.rate * item.quantity;
          }
        });
      } else {
        // Apply to entire order (subtotal)
        if (taxSetting.type === 'percentage') {
          taxAmount = (subtotal * taxSetting.rate) / 100;
        } else if (taxSetting.type === 'fixed') {
          taxAmount = taxSetting.rate;
        }
      }

      tax += taxAmount;
      taxBreakdown.push({
        name: taxSetting.name,
        rate: taxSetting.rate,
        amount: taxAmount,
        type: taxSetting.type,
      });
      console.log(`Tax applied: ${taxSetting.name} (${taxSetting.type}, ${taxSetting.applyTo}) = $${taxAmount.toFixed(2)}`);
    });

    console.log('Final tax breakdown:', taxBreakdown);
    console.log('Total tax amount:', tax);
    console.log('=== END TAX CALCULATION DEBUG ===');

    // Calculate global/platform fee
    const globalFee = restaurant.financialSettings?.globalFee as any;
    let platformFee = 0;

    console.log('=== GLOBAL FEE CALCULATION DEBUG ===');
    console.log('Global Fee Settings:', globalFee);

    if (globalFee && globalFee.enabled) {
      const threshold = globalFee.threshold || 0;

      if (subtotal < threshold) {
        // Order below threshold - apply percentage fee
        const belowPercent = globalFee.belowPercent || 0;
        platformFee = (subtotal * belowPercent) / 100;
        console.log(`Order below threshold ($${threshold}): ${belowPercent}% fee = $${platformFee.toFixed(2)}`);
      } else {
        // Order at or above threshold - apply flat fee
        const aboveFlat = globalFee.aboveFlat || 0;
        platformFee = aboveFlat;
        console.log(`Order at/above threshold ($${threshold}): Flat $${aboveFlat} fee`);
      }
    } else {
      console.log('Global fee disabled or not configured');
    }

    console.log('Platform Fee:', platformFee);
    console.log('=== END GLOBAL FEE CALCULATION DEBUG ===');

    const total = subtotal + tax + platformFee;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        restaurantId: input.restaurantId,
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerAddress: {},
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
        deliveryFee: 0,
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
      include: { financialSettings: true },
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

    const taxes = (restaurant.financialSettings?.taxes as any[]) || [];
    let tax = 0;
    const taxBreakdown: any[] = [];

    taxes.forEach((taxSetting: any) => {
      if (!taxSetting.enabled) {
        return;
      }

      let taxAmount = 0;

      if (taxSetting.applyTo === 'per_item') {
        // Apply tax per item
        orderItems.forEach((item) => {
          const itemTotal = item.price * item.quantity;

          if (taxSetting.type === 'percentage') {
            taxAmount += (itemTotal * taxSetting.rate) / 100;
          } else if (taxSetting.type === 'fixed') {
            taxAmount += taxSetting.rate * item.quantity;
          }
        });
      } else {
        // Apply to entire order (subtotal)
        if (taxSetting.type === 'percentage') {
          taxAmount = (subtotal * taxSetting.rate) / 100;
        } else if (taxSetting.type === 'fixed') {
          taxAmount = taxSetting.rate;
        }
      }

      tax += taxAmount;
      taxBreakdown.push({
        name: taxSetting.name,
        rate: taxSetting.rate,
        amount: taxAmount,
        type: taxSetting.type,
      });
    });

    // Calculate global/platform fee
    const globalFee = restaurant.financialSettings?.globalFee as any;
    let platformFee = 0;

    if (globalFee && globalFee.enabled) {
      const threshold = globalFee.threshold || 0;

      if (subtotal < threshold) {
        const belowPercent = globalFee.belowPercent || 0;
        platformFee = (subtotal * belowPercent) / 100;
      } else {
        const aboveFlat = globalFee.aboveFlat || 0;
        platformFee = aboveFlat;
      }
    }

    const total = subtotal + tax + platformFee;

    const order = await prisma.order.update({
      where: { id: input.orderId },
      data: {
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        items: orderItems,
        orderType: input.orderType,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        subtotal,
        tax,
        taxBreakdown,
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
