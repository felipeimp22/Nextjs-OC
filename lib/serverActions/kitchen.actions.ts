'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateTaxes, TaxSetting, TaxCalculationItem } from '@/lib/utils/taxCalculator';
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';
import { calculateDeliveryFee, DeliverySettings } from '@/lib/utils/deliveryFeeCalculator';
import { DeliveryFactory } from '@/lib/delivery/DeliveryFactory';

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

export async function updateOrdersBatch(restaurantId: string, updates: Array<{ id: string; status?: string; priority?: number }>) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      console.error('❌ updateOrdersBatch: Unauthorized - no session');
      return { success: false, error: "Unauthorized" };
    }

    console.log('=== UPDATE ORDERS BATCH ===');
    console.log('restaurantId:', restaurantId);
    console.log('updates:', JSON.stringify(updates, null, 2));

    const results = await Promise.all(
      updates.map(async (update) => {
        const updateData: any = {};

        if (update.status) {
          updateData.status = update.status;
        }

        if (update.priority !== undefined) {
          updateData.priority = update.priority;
        }

        console.log(`Updating order ${update.id}:`, updateData);

        const result = await prisma.order.update({
          where: { id: update.id },
          data: updateData,
        });

        console.log(`✅ Order ${update.id} updated to status: ${result.status}, priority: ${result.priority}`);
        return result;
      })
    );

    revalidatePath(`/${restaurantId}/kitchen`);
    console.log('✅ updateOrdersBatch completed successfully');
    console.log('Updated orders:', results.map(r => ({ id: r.id, status: r.status, priority: r.priority })));
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error updating orders batch:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return { success: false, error: error.message };
  }
}
