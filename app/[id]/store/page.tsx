'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicRestaurantData } from '@/lib/serverActions/order.actions';
import { useCartStore } from '@/stores/useCartStore';
import MenuItem from '@/components/store/MenuItem';
import CartSidebar from '@/components/store/CartSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/ToastContainer';

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const isMobile = useIsMobile();
  const { showToast } = useToast();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { addItem } = useCartStore();

  useEffect(() => {
    loadRestaurant();
  }, [restaurantId]);

  const loadRestaurant = async () => {
    setIsLoading(true);
    const result = await getPublicRestaurantData(restaurantId);

    if (result.success && result.data) {
      setRestaurant(result.data);
      if (result.data.categories.length > 0) {
        setSelectedCategory(result.data.categories[0].id);
      }
    } else {
      showToast('error', result.error || 'Restaurant not found');
    }

    setIsLoading(false);
  };

  const handleAddToCart = (item: any, selectedOptions: any[], specialInstructions?: string) => {
    const cartOptions = selectedOptions.map((opt) => ({
      optionId: opt.optionId,
      optionName: opt.optionName,
      choiceId: opt.choiceId,
      choiceName: opt.choiceName,
      quantity: opt.quantity || 1,
      priceAdjustment: opt.priceAdjustment,
    }));

    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        quantity: item.quantity || 1,
        selectedOptions: cartOptions,
        specialInstructions,
        image: item.image,
      },
      restaurantId
    );

    showToast('success', 'Item added to cart!');
  };

  const handleCheckout = () => {
    router.push(`/${restaurantId}/checkout`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const filteredItems = selectedCategory
    ? restaurant.items.filter((item: any) => item.categoryId === selectedCategory)
    : restaurant.items;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        className="py-6 px-4 shadow-md"
        style={{ backgroundColor: restaurant.colors.primary }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {restaurant.logo && (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-16 h-16 rounded-lg object-cover bg-white"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-white/90 mt-1">{restaurant.description}</p>
              )}
              <p className="text-white/80 text-sm mt-1">
                {restaurant.address.city}, {restaurant.address.state}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-8`}>
          <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
            {restaurant.categories.length > 0 && (
              <div className="mb-6 sticky top-0 bg-white z-10 rounded-lg shadow p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {restaurant.categories.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-brand-navy text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No items available in this category.</p>
                </div>
              ) : (
                filteredItems.map((item: any) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    menuRules={restaurant.menuRules}
                    options={restaurant.options}
                    currencySymbol={restaurant.currencySymbol}
                    onAddToCart={handleAddToCart}
                  />
                ))
              )}
            </div>
          </div>

          <div className={isMobile ? 'col-span-1 order-first' : 'col-span-1'}>
            <CartSidebar currencySymbol={restaurant.currencySymbol} onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </div>
  );
}
