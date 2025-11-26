interface Order {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  platformFee: number;
  paymentStatus: string;
  orderType: string;
  status: string;
  customerId?: string;
  createdAt: Date;
}

interface Customer {
  id: string;
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  netRevenue: number;
  averageOrderValue: number;
  refundAmount: number;
  refundCount: number;
}

export interface OrderMetrics {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  conversionRate: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface OrdersByType {
  pickup: { count: number; revenue: number };
  delivery: { count: number; revenue: number };
  dineIn: { count: number; revenue: number };
}

export interface OrdersByStatus {
  [key: string]: number;
}

export function calculateRevenueMetrics(orders: Order[]): RevenueMetrics {
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const refundedOrders = orders.filter(
    (o) => o.paymentStatus === 'refunded' || o.paymentStatus === 'partially_refunded'
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const refundAmount = refundedOrders.reduce((sum, o) => sum + o.total, 0);
  const netRevenue = totalRevenue - refundAmount;
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  return {
    totalRevenue,
    netRevenue,
    averageOrderValue,
    refundAmount,
    refundCount: refundedOrders.length,
  };
}

export function calculateOrderMetrics(orders: Order[]): OrderMetrics {
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
  const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    cancelledOrders,
    conversionRate,
  };
}

export function calculateCustomerMetrics(
  customers: Customer[],
  dateFrom: Date,
  dateTo: Date
): CustomerMetrics {
  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c) => {
    const createdAt = new Date(c.createdAt);
    return createdAt >= dateFrom && createdAt <= dateTo;
  }).length;
  const returningCustomers = customers.filter((c) => c.orderCount > 1).length;

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
  };
}

export function calculateOrdersByType(orders: Order[]): OrdersByType {
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  const pickup = paidOrders.filter((o) => o.orderType === 'pickup');
  const delivery = paidOrders.filter((o) => o.orderType === 'delivery');
  const dineIn = paidOrders.filter((o) => o.orderType === 'dine_in');

  return {
    pickup: {
      count: pickup.length,
      revenue: pickup.reduce((sum, o) => sum + o.total, 0),
    },
    delivery: {
      count: delivery.length,
      revenue: delivery.reduce((sum, o) => sum + o.total, 0),
    },
    dineIn: {
      count: dineIn.length,
      revenue: dineIn.reduce((sum, o) => sum + o.total, 0),
    },
  };
}

export function calculateOrdersByStatus(orders: Order[]): OrdersByStatus {
  // Initialize all kitchen statuses to 0 to ensure we always return all statuses
  const statusCounts: OrdersByStatus = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    completed: 0,
  };

  // Count actual orders by status
  orders.forEach((order) => {
    const status = order.status;
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    } else {
      // Handle any unexpected statuses (like 'cancelled')
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
  });

  return statusCounts;
}

export function calculateRevenueBreakdown(orders: Order[]) {
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  return {
    subtotal: paidOrders.reduce((sum, o) => sum + o.subtotal, 0),
    tax: paidOrders.reduce((sum, o) => sum + o.tax, 0),
    deliveryFees: paidOrders.reduce((sum, o) => sum + o.deliveryFee, 0),
    tips: paidOrders.reduce((sum, o) => sum + o.tip, 0),
    platformFees: paidOrders.reduce((sum, o) => sum + o.platformFee, 0),
  };
}

export function getTopCustomers(
  customers: Customer[],
  limit: number = 10
): Customer[] {
  return customers
    .filter((c) => c.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}
