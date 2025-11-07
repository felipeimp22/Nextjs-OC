'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useUserRestaurants } from '@/hooks/useRestaurants';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { Button } from '@/components/ui';

export default function SelectRestaurantPage() {
  const t = useTranslations('restaurantSelector');
  const tGettingStarted = useTranslations('gettingStarted');
  const router = useRouter();
  const { data: restaurants = [], isLoading } = useUserRestaurants();
  const { setSelectedRestaurant } = useRestaurantStore();

  useEffect(() => {
    if (!isLoading && restaurants.length === 0) {
      router.push('/getting-started');
    }
  }, [restaurants, isLoading, router]);

  const handleSelectRestaurant = (id: string, name: string) => {
    setSelectedRestaurant(id, name);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/images/logo.png" alt="OrderChop Logo" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="space-y-4 mb-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => handleSelectRestaurant(restaurant.id, restaurant.name)}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:border-2 hover:border-brand-navy transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {restaurant.logo && (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {restaurant.street}, {restaurant.city}, {restaurant.state}
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-3 py-1 bg-brand-navy/10 text-brand-navy text-xs font-medium rounded-full">
                        {t('role')}: {restaurant.role === 'owner' ? t('owner') : restaurant.role}
                      </span>
                    </div>
                  </div>
                </div>

                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tGettingStarted('createRestaurant')} / {tGettingStarted('searchRestaurant')}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {tGettingStarted('createDescription')}
            </p>
            <Button
              onClick={() => router.push('/getting-started')}
              className="bg-brand-red hover:bg-brand-red/90"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {tGettingStarted('chooseOption')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
