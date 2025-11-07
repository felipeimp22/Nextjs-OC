'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface Restaurant {
  id: string;
  name: string;
  role: string;
  street: string;
  city: string;
  state: string;
  logo?: string | null;
}

interface RestaurantSelectorProps {
  restaurants: Restaurant[];
  onClose?: () => void;
}

export default function RestaurantSelector({ restaurants, onClose }: RestaurantSelectorProps) {
  const t = useTranslations('restaurantSelector');
  const router = useRouter();

  const handleSelect = (restaurantId: string) => {
    router.push(`/dashboard`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {restaurants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('noRestaurants')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-brand-navy hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelect(restaurant.id)}
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
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-brand-navy/10 text-brand-navy text-xs font-medium rounded-full">
                            {t('role')}: {restaurant.role === 'owner' ? t('owner') : restaurant.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button className="bg-brand-navy hover:bg-brand-navy/90">
                      {t('selectButton')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
