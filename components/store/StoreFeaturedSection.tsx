'use client';

import { useTranslations } from 'next-intl';
import StoreProductCard from './StoreProductCard';

interface StoreFeaturedSectionProps {
  items: any[];
  menuRules: any[];
  options: any[];
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  onAddToCart: (item: any, selectedOptions: any[], specialInstructions?: string) => void;
  title?: string;
}

export default function StoreFeaturedSection({
  items,
  menuRules,
  options,
  currencySymbol,
  primaryColor,
  secondaryColor,
  onAddToCart,
  title,
}: StoreFeaturedSectionProps) {
  const t = useTranslations('store');
  const displayTitle = title || t('featuredItems');

  if (items.length === 0) return null;

  return (
    <div className="py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 px-4">{displayTitle}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
        {items.map((item) => (
          <StoreProductCard
            key={item.id}
            item={item}
            menuRules={menuRules}
            options={options}
            currencySymbol={currencySymbol}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onAddToCart={onAddToCart}
            variant="card"
          />
        ))}
      </div>
    </div>
  );
}