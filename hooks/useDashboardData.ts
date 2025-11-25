import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/serverActions/analytics.actions';

export function useDashboardData(
  restaurantId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['dashboard', restaurantId, dateFrom, dateTo],
    queryFn: async () => {
      const result = await getDashboardData(restaurantId, dateFrom, dateTo);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!restaurantId && !!dateFrom && !!dateTo,
  });
}
