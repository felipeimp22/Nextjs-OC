'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useCustomers } from '@/hooks/useCustomers';
import CustomersList from '@/components/customers/CustomersList';
import { useQuery } from '@tanstack/react-query';
import { getRestaurantMenuData } from '@/lib/serverActions/menu.actions';

export default function CustomersPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useCustomers(restaurantId);

  const { data: menuData } = useQuery({
    queryKey: ['restaurantMenuData', restaurantId],
    queryFn: async () => {
      const result = await getRestaurantMenuData(restaurantId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!selectedRestaurantId && selectedRestaurantId === restaurantId,
  });

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/customers`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

  const handleCustomerUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', restaurantId] });
  };

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  return (
    <CustomersList
      customers={customers}
      currencySymbol={menuData?.currencySymbol || '$'}
      onCustomerUpdated={handleCustomerUpdated}
    />
  );
}
