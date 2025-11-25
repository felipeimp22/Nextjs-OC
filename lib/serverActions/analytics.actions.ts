'use server';

import { prisma } from '@/lib/prisma';
import {
  calculateRevenueMetrics,
  calculateOrderMetrics,
  calculateCustomerMetrics,
  calculateOrdersByType,
  calculateOrdersByStatus,
  calculateRevenueBreakdown,
  getTopCustomers,
} from '@/lib/utils/analyticsCalculator';

export async function getDashboardData(
  restaurantId: string,
  dateFrom: string,
  dateTo: string
) {
  try {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    const [orders, customers, restaurant] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          total: true,
          subtotal: true,
          tax: true,
          tip: true,
          deliveryFee: true,
          platformFee: true,
          paymentStatus: true,
          orderType: true,
          status: true,
          customerId: true,
          createdAt: true,
        },
      }),
      prisma.customer.findMany({
        where: {
          restaurantId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          orderCount: true,
          totalSpent: true,
          lastOrderDate: true,
          createdAt: true,
        },
      }),
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          financialSettings: {
            select: {
              currencySymbol: true,
            },
          },
        },
      }),
    ]);

    const previousPeriodFrom = new Date(
      fromDate.getTime() - (toDate.getTime() - fromDate.getTime())
    );
    const previousOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: previousPeriodFrom,
          lt: fromDate,
        },
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        tax: true,
        tip: true,
        deliveryFee: true,
        platformFee: true,
        paymentStatus: true,
        orderType: true,
        status: true,
        customerId: true,
        createdAt: true,
      },
    });

    const revenueMetrics = calculateRevenueMetrics(orders);
    const orderMetrics = calculateOrderMetrics(orders);
    const customerMetrics = calculateCustomerMetrics(customers, fromDate, toDate);
    const ordersByType = calculateOrdersByType(orders);
    const ordersByStatus = calculateOrdersByStatus(orders);
    const revenueBreakdown = calculateRevenueBreakdown(orders);
    const topCustomers = getTopCustomers(customers, 10);

    const previousRevenueMetrics = calculateRevenueMetrics(previousOrders);
    const previousOrderMetrics = calculateOrderMetrics(previousOrders);
    const previousCustomerMetrics = calculateCustomerMetrics(
      customers,
      previousPeriodFrom,
      fromDate
    );

    return {
      success: true,
      data: {
        currentPeriod: {
          revenue: revenueMetrics,
          orders: orderMetrics,
          customers: customerMetrics,
          ordersByType,
          ordersByStatus,
          revenueBreakdown,
          topCustomers,
          rawOrders: orders,
        },
        previousPeriod: {
          revenue: previousRevenueMetrics,
          orders: previousOrderMetrics,
          customers: previousCustomerMetrics,
        },
        restaurant: {
          currencySymbol: restaurant?.financialSettings?.currencySymbol || '$',
          primaryColor: restaurant?.primaryColor || '#282e59',
          secondaryColor: restaurant?.secondaryColor || '#d4af37',
          accentColor: restaurant?.accentColor || '#c7a146',
        },
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard data',
    };
  }
}
