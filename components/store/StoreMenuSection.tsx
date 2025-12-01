'use client';

import { forwardRef } from 'react';
import StoreProductCard from './StoreProductCard';

interface StoreMenuSectionProps {
  category: {
    id: string;
    name: string;
    description?: string;
  };
  items: any[];
  menuRules: any[];
  options: any[];
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  onAddToCart: (item: any, selectedOptions: any[], specialInstructions?: string) => void;
}

const StoreMenuSection = forwardRef<HTMLDivElement, StoreMenuSectionProps>(
  ({ category, items, menuRules, options, currencySymbol, primaryColor, secondaryColor, onAddToCart }, ref) => {
    if (items.length === 0) return null;

    return (
      <div ref={ref} id={`category-${category.id}`} className="py-6 scroll-mt-20">
        <div className="px-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
          {category.description && (
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          )}
        </div>

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
);

StoreMenuSection.displayName = 'StoreMenuSection';

export default StoreMenuSection;