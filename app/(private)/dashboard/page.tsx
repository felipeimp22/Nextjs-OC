'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurantStore } from '@/stores/useRestaurantStore';

export default function Dashboard() {
  const router = useRouter();
  const { selectedRestaurantId, selectedRestaurantName } = useRestaurantStore();

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/select-restaurant');
    }
  }, [selectedRestaurantId, router]);

  if (!selectedRestaurantId) {
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
    </div>
  );
}