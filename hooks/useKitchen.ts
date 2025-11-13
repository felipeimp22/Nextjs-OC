'use client';

import { useQuery } from '@tanstack/react-query';
import { getKitchenOrders, getKitchenStages } from '@/lib/serverActions/kitchen.actions';
import { getRestaurantMenuData } from '@/lib/serverActions/menu.actions';

export function useKitchenOrders(restaurantId: string) {
  return useQuery({
    queryKey: ['kitchenOrders', restaurantId],
    queryFn: async () => {
      const result = await getKitchenOrders(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch kitchen orders');
      }
      return result.data || [];
    },
    enabled: !!restaurantId,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 1000 * 60,
  });
}

export function useKitchenStages(restaurantId: string) {
  return useQuery({
    queryKey: ['kitchenStages', restaurantId],
    queryFn: async () => {
      const result = await getKitchenStages(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch kitchen stages');
      }
      return result.data || [];
    },
    enabled: !!restaurantId,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRestaurantMenuData(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurantMenuData', restaurantId],
    queryFn: async () => {
      const result = await getRestaurantMenuData(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menu data');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}
