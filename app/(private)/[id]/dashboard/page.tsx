'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRestaurantStore } from '@/stores/useRestaurantStore';

export default function RestaurantDashboard() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId, selectedRestaurantName, setSelectedRestaurant } = useRestaurantStore();

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/dashboard`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600">Welcome to {selectedRestaurantName}!</p>
      <p className="text-sm text-gray-500 mt-2">Restaurant ID: {restaurantId}</p>
    </div>
  );
}
