'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRestaurants } from '@/hooks/useRestaurants';
import RestaurantSelector from '@/components/restaurant/RestaurantSelector';

export default function Dashboard() {
  const router = useRouter();
  const { data: restaurants = [], isLoading } = useUserRestaurants();

  useEffect(() => {
    if (!isLoading && restaurants.length === 0) {
      router.push('/getting-started');
    }
  }, [restaurants, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return null;
  }

  if (restaurants.length > 1) {
    return <RestaurantSelector restaurants={restaurants} />;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600">Welcome to {restaurants[0]?.name}!</p>
    </div>
  );
}