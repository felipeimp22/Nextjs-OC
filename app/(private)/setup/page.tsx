'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useUserRestaurants } from '@/hooks/useRestaurants';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import RestaurantForm from '@/components/setup/RestaurantForm';
import RestaurantSearch from '@/components/setup/RestaurantSearch';
import { Button } from '@/components/ui';
import { getFirstAccessiblePage } from '@/lib/serverActions/permissions.actions';
import { useToast } from '@/components/ui/ToastContainer';

type Mode = 'list' | 'create' | 'search';

export default function SetupPage() {
  const t = useTranslations('restaurantSelector');
  const tGettingStarted = useTranslations('gettingStarted');
  const router = useRouter();
  const { data: restaurants = [], isLoading } = useUserRestaurants();
  const { setSelectedRestaurant } = useRestaurantStore();
  const [mode, setMode] = useState<Mode>('list');
  const { toast } = useToast();

  const handleSelectRestaurant = async (id: string, name: string) => {
    setSelectedRestaurant(id, name);

    // Get the first accessible page for this user
    const result = await getFirstAccessiblePage(id);

    if (result.success && result.data) {
      router.push(result.data);
    } else {
      toast.error('No permissions assigned. Please contact the restaurant owner.');
      router.push('/setup');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (restaurants.length === 0 && mode === 'list') {
    setMode('create');
  }

  return (
    <div className="min-h-screen bg-brand-lightGray flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-6xl">
        {mode === 'list' && restaurants.length > 0 && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
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
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setMode('create')}
                    className="bg-brand-navy hover:bg-brand-navy/90"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {tGettingStarted('createRestaurant')}
                  </Button>
                  <Button
                    onClick={() => setMode('search')}
                    className="bg-brand-red hover:bg-brand-red/90"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {tGettingStarted('searchRestaurant')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div>
            {restaurants.length > 0 && (
              <button
                onClick={() => setMode('list')}
                className="mb-6 text-brand-navy hover:text-brand-navy/80 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {tGettingStarted('backToOptions')}
              </button>
            )}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tGettingStarted('createRestaurant')}</h1>
              <p className="text-gray-600">{tGettingStarted('createDescription')}</p>
            </div>
            <RestaurantForm />
          </div>
        )}

        {mode === 'search' && (
          <div>
            <button
              onClick={() => setMode('list')}
              className="mb-6 text-brand-navy hover:text-brand-navy/80 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {tGettingStarted('backToOptions')}
            </button>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tGettingStarted('searchRestaurant')}</h1>
              <p className="text-gray-600">{tGettingStarted('searchDescription')}</p>
            </div>
            <RestaurantSearch />
          </div>
        )}
      </div>
    </div>
  );
}