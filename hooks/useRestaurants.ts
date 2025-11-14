'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserRestaurants,
  createRestaurant,
  searchRestaurants,
  requestRestaurantAccess,
  getRestaurant,
  updateRestaurant,
} from '@/lib/serverActions/restaurant.actions';

interface CreateRestaurantData {
  name: string;
  description?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone: string;
  email: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
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
      queryClient.invalidateQueries({ queryKey: ['user-restaurants'] });
    },
  });
}

export function useSearchRestaurants(query: string) {
  return useQuery({
    queryKey: ['search-restaurants', query],
    queryFn: async () => {
      const result = await searchRestaurants(query);
      if (!result.success) {
        throw new Error(result.error || 'Failed to search restaurants');
      }
      return result.data;
    },
    enabled: query.length > 2,
    staleTime: 1000 * 60,
  });
}

export function useRequestRestaurantAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, message }: { restaurantId: string; message?: string }) => {
      const result = await requestRestaurantAccess(restaurantId, message);
      if (!result.success) {
        throw new Error(result.error || 'Failed to request access');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-restaurants'] });
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
      queryClient.invalidateQueries({ queryKey: ['user-restaurants'] });
    },
  });
}