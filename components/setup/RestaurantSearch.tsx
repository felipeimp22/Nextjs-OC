'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSearchRestaurants, useRequestRestaurantAccess } from '@/hooks/useRestaurants';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { Button } from '@/components/ui';

export default function RestaurantSearch() {
  const t = useTranslations('gettingStarted');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const { data: restaurants = [], isLoading } = useSearchRestaurants(query);
  const requestAccessMutation = useRequestRestaurantAccess();
  const { setSelectedRestaurant } = useRestaurantStore();

  const handleRequestAccess = async (restaurantId: string, restaurantName: string) => {
    try {
      await requestAccessMutation.mutateAsync(restaurantId);
      setRequestedIds(prev => new Set(prev).add(restaurantId));
      setSelectedRestaurant(restaurantId, restaurantName);
      setTimeout(() => {
        router.push(`/${restaurantId}/dashboard`);
      }, 1000);
    } catch (error) {
      console.error('Error requesting access:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
        />
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('searching')}</p>
        </div>
      )}

      {!isLoading && query.length > 2 && restaurants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('noResults')}</p>
        </div>
      )}

      {!isLoading && restaurants.length > 0 && (
        <div className="space-y-4">
          {restaurants.map((restaurant) => {
            const hasRequested = requestedIds.has(restaurant.id);

            return (
              <div
                key={restaurant.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
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
                      <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {restaurant.street}, {restaurant.city}, {restaurant.state}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRequestAccess(restaurant.id, restaurant.name)}
                    disabled={hasRequested || requestAccessMutation.isPending}
                    className={
                      hasRequested
                        ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed'
                        : 'bg-brand-navy hover:bg-brand-navy/90'
                    }
                  >
                    {hasRequested ? t('requestSent') : t('requestAccess')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
