'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStoreConfig,
  updateStoreConfig,
} from '@/lib/serverActions/storeConfig.actions';

interface FeaturedItem {
  type: 'item' | 'category';
  itemId?: string;
  categoryId?: string;
}

interface SpecialItem {
  id?: string;
  type: 'item' | 'category' | 'custom';
  itemId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  image?: string;
  ctaText?: string;
  order?: number;
}

interface UpdateStoreConfigData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  featuredItemsEnabled?: boolean;
  featuredItemsTitle?: string;
  featuredItems?: FeaturedItem[];
  specialsEnabled?: boolean;
  specialsTitle?: string;
  specialItems?: SpecialItem[];
}

export function useStoreConfig(restaurantId: string) {
  return useQuery({
    queryKey: ['store-config', restaurantId],
    queryFn: async () => {
      const result = await getStoreConfig(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch store config');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateStoreConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, data }: { restaurantId: string; data: UpdateStoreConfigData }) => {
      const result = await updateStoreConfig(restaurantId, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update store config');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-config', variables.restaurantId] });
    },
  });
}
