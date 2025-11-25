'use client';

import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/lib/serverActions/customer.actions';

interface CustomersFilters {
  search?: string;
  sortBy?: string;
  tags?: string[];
}

export function useCustomers(restaurantId: string, filters?: CustomersFilters) {
  return useQuery({
    queryKey: ['customers', restaurantId, filters],
    queryFn: async () => {
      const result = await getCustomers(restaurantId, filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch customers');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 2,
  });
}
