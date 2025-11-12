'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOptionCategories,
  createOptionCategory,
  updateOptionCategory,
  deleteOptionCategory,
  getOptions,
  createOption,
  updateOption,
  deleteOption,
  getMenuRules,
  createOrUpdateMenuRules,
  deleteMenuRules,
} from '@/lib/serverActions/menu.actions';

export function useMenuCategories(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: async () => {
      const result = await getMenuCategories(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menu categories');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createMenuCategory(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create menu category');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', variables.restaurantId] });
    },
  });
}

export function useUpdateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateMenuCategory(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update menu category');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', variables.data.restaurantId] });
    },
  });
}

export function useDeleteMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const result = await deleteMenuCategory(id, restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete menu category');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.restaurantId] });
    },
  });
}

export function useMenuItems(restaurantId: string, categoryId?: string) {
  return useQuery({
    queryKey: categoryId ? ['menu-items', restaurantId, categoryId] : ['menu-items', restaurantId],
    queryFn: async () => {
      const result = await getMenuItems(restaurantId, categoryId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menu items');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createMenuItem(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create menu item');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.restaurantId] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateMenuItem(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update menu item');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.data.restaurantId] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const result = await deleteMenuItem(id, restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete menu item');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.restaurantId] });
    },
  });
}

export function useOptionCategories(restaurantId: string) {
  return useQuery({
    queryKey: ['option-categories', restaurantId],
    queryFn: async () => {
      const result = await getOptionCategories(restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch option categories');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOptionCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createOptionCategory(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create option category');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['option-categories', variables.restaurantId] });
    },
  });
}

export function useUpdateOptionCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateOptionCategory(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update option category');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['option-categories', variables.data.restaurantId] });
    },
  });
}

export function useDeleteOptionCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const result = await deleteOptionCategory(id, restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete option category');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['option-categories', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['options', variables.restaurantId] });
    },
  });
}

export function useOptions(restaurantId: string, categoryId?: string) {
  return useQuery({
    queryKey: categoryId ? ['options', restaurantId, categoryId] : ['options', restaurantId],
    queryFn: async () => {
      const result = await getOptions(restaurantId, categoryId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch options');
      }
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createOption(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create option');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['options', variables.restaurantId] });
    },
  });
}

export function useUpdateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateOption(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update option');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['options', variables.data.restaurantId] });
    },
  });
}

export function useDeleteOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const result = await deleteOption(id, restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete option');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['options', variables.restaurantId] });
    },
  });
}

export function useMenuRules(menuItemId: string) {
  return useQuery({
    queryKey: ['menu-rules', menuItemId],
    queryFn: async () => {
      const result = await getMenuRules(menuItemId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menu rules');
      }
      return result.data;
    },
    enabled: !!menuItemId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOrUpdateMenuRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createOrUpdateMenuRules(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save menu rules');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-rules', variables.menuItemId] });
    },
  });
}

export function useDeleteMenuRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ menuItemId, restaurantId }: { menuItemId: string; restaurantId: string }) => {
      const result = await deleteMenuRules(menuItemId, restaurantId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete menu rules');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-rules', variables.menuItemId] });
    },
  });
}
