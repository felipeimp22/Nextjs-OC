import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantStats,
  getUserRestaurants
} from '@/lib/serverActions/restaurant.actions';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRestaurantData {
  name: string;
  address: string;
  phone: string;
}

export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const result = await getRestaurants();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch restaurants');
      }
      return result.data;
    },
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const result = await getRestaurant(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch restaurant');
      }
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateRestaurantData) => {
      const result = await createRestaurant(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create restaurant');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRestaurantData> }) => {
      const result = await updateRestaurant(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update restaurant');
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', data?.id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRestaurant(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete restaurant');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useRestaurantStats(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant-stats', restaurantId],
    queryFn: async () => {
      const result = await getRestaurantStats(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      return result.data;
    },
    enabled: !!restaurantId,
  });
}

export function useUserRestaurants() {
  return useQuery({
    queryKey: ['user-restaurants'],
    queryFn: async () => {
      const result = await getUserRestaurants();
      if (!result.success) {
        throw new Error('Failed to fetch restaurants');
      }
      return result.restaurants;
    },
    staleTime: 1000 * 60 * 5,
  });
}