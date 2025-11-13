'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

    const menuItemsMap = new Map(menuItems.map(item => [item.id, item]));

    let subtotal = 0;
    const orderItems = input.items.map(item => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }

      let itemPrice = menuItem.price;
      if (item.options) {
        item.options.forEach(option => {
          itemPrice += option.priceAdjustment;
        });
      }

      const finalPrice = itemPrice * item.quantity;
      subtotal += finalPrice;

      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
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
      if (taxSetting.enabled) {
        const taxAmount = (subtotal * taxSetting.rate) / 100;
        tax += taxAmount;
        taxBreakdown.push({
          name: taxSetting.name,
          rate: taxSetting.rate,
          amount: taxAmount,
        });
      }
    });

    const total = subtotal + tax;

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
        platformFee: 0,
        total,
        specialInstructions: input.specialInstructions,
        timezone: 'America/New_York',
        localDate: new Date().toISOString().split('T')[0],
        localDateTime: new Date(),
      },
    });

    revalidatePath(`/${input.restaurantId}/kitchen`);
    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error creating in-house order:', error);
    return { success: false, error: error.message };
  }
}
