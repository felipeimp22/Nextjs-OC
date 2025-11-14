'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getUserPermissions } from '@/lib/serverActions/permissions.actions';

export function useUserPermissions() {
  const params = useParams();
  const restaurantId = params.id as string;

  return useQuery({
    queryKey: ['user-permissions', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;

      const result = await getUserPermissions(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch permissions');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
