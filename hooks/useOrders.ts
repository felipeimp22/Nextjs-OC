'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/serverActions/order.actions';

interface OrdersFilters {
  status?: string;
  orderType?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useOrders(restaurantId: string, filters?: OrdersFilters) {
  return useQuery({
    queryKey: ['orders', restaurantId, filters],
    queryFn: async () => {
      const result = await getOrders(restaurantId, filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 2,
  });
}
