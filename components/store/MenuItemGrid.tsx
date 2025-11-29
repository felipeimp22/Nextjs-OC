import { MenuItem } from '@/components/MenuItem';

interface MenuItemGridProps {
  items: any[];
  menuRules: any[];
  options: any[];
  currencySymbol: string;
  onAddToCart: (item: any, options: any[], instructions?: string) => void;
}

export function MenuItemGrid({
  items,
  menuRules,
  options,
  currencySymbol,
  onAddToCart,
}: MenuItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No items available in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          menuRules={menuRules}
          options={options}
          currencySymbol={currencySymbol}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
