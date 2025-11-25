'use server';

import prisma from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface CustomersFilters {
  search?: string;
  sortBy?: string;
  tags?: string[];
}

export async function getCustomers(restaurantId: string, filters?: CustomersFilters) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {
      restaurantId,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    let orderBy: any = { createdAt: 'desc' };

    if (filters?.sortBy === 'totalSpent') {
      orderBy = { totalSpent: 'desc' };
    } else if (filters?.sortBy === 'orderCount') {
      orderBy = { orderCount: 'desc' };
    } else if (filters?.sortBy === 'lastOrderDate') {
      orderBy = { lastOrderDate: 'desc' };
    } else if (filters?.sortBy === 'name') {
      orderBy = { name: 'asc' };
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy,
    });

    return {
      success: true,
      data: customers,
    };
  } catch (error: any) {
    console.error('Get customers error:', error);
    return { success: false, error: error.message };
  }
}

interface UpdateCustomerInput {
  customerId: string;
  name?: string;
  email?: string;
  phone?: any;
  tags?: string[];
  notes?: string;
}

export async function updateCustomer(input: UpdateCustomerInput) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const customer = await prisma.customer.update({
      where: { id: input.customerId },
      data: updateData,
    });

    revalidatePath('/[id]/customers', 'page');

    return {
      success: true,
      data: customer,
    };
  } catch (error: any) {
    console.error('Update customer error:', error);
    return { success: false, error: error.message };
  }
}

export async function findOrCreateCustomer(
  email: string,
  name: string,
  phone: string,
  restaurantId: string
) {
  try {
    let customer = await prisma.customer.findUnique({
      where: {
        restaurantId_email: {
          restaurantId,
          email,
        },
      },
    });

    if (!customer) {
      const phoneData = phone ? { countryCode: '+1', number: phone } : null;

      customer = await prisma.customer.create({
        data: {
          restaurantId,
          name,
          email,
          phone: phoneData,
          orderCount: 0,
          totalSpent: 0,
          orderHistory: [],
          tags: [],
        },
      });

      console.log(`✅ Created new customer: ${email} (ID: ${customer.id})`);
    }

    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Find or create customer error:', error);
    return { success: false, error: error.message };
  }
}

export async function addOrderToCustomerHistory(customerId: string, orderId: string) {
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        orderHistory: {
          push: orderId,
        },
      },
    });

    console.log(`✅ Added order ${orderId} to customer ${customerId} history`);
    return { success: true };
  } catch (error: any) {
    console.error('Add order to customer history error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomerStats(
  customerId: string,
  orderTotal: number,
  isPaid: boolean,
  isIncrement: boolean = true
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    if (!isPaid) {
      console.log(`⏭️ Skipping customer stats update - payment status not 'paid'`);
      return { success: true };
    }

    const orderCountChange = isIncrement ? 1 : -1;
    const totalSpentChange = isIncrement ? orderTotal : -orderTotal;

    const updateData: any = {
      orderCount: Math.max(0, customer.orderCount + orderCountChange),
      totalSpent: Math.max(0, customer.totalSpent + totalSpentChange),
    };

    if (isIncrement) {
      updateData.lastOrderDate = new Date();
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    console.log(`✅ Updated customer stats: ${isIncrement ? 'increment' : 'decrement'} order count by 1, ${isIncrement ? 'add' : 'subtract'} $${orderTotal.toFixed(2)}`);

    return { success: true };
  } catch (error: any) {
    console.error('Update customer stats error:', error);
    return { success: false, error: error.message };
  }
}

export async function handleOrderPaymentChange(
  orderId: string,
  oldPaymentStatus: string,
  newPaymentStatus: string,
  orderTotal: number,
  customerId: string
) {
  try {
    if (oldPaymentStatus === 'paid' && newPaymentStatus !== 'paid') {
      await updateCustomerStats(customerId, orderTotal, true, false);
      console.log(`💰 Payment changed from paid to ${newPaymentStatus} - Decremented customer stats`);
    }

    if (oldPaymentStatus !== 'paid' && newPaymentStatus === 'paid') {
      await updateCustomerStats(customerId, orderTotal, true, true);
      console.log(`💰 Payment changed from ${oldPaymentStatus} to paid - Incremented customer stats`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Handle order payment change error:', error);
    return { success: false, error: error.message };
  }
}
