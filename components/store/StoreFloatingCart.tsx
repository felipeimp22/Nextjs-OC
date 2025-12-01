'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

interface StoreFloatingCartProps {
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  onCheckout: () => void;
}

export default function StoreFloatingCart({
  currencySymbol,
  primaryColor,
  secondaryColor,
  onCheckout,
}: StoreFloatingCartProps) {
  const { items, getTotal, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <button
        onClick={onCheckout}
        className="w-full flex items-center justify-between px-6 py-4 rounded-full text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span 
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: secondaryColor }}
            >
              {itemCount}
            </span>
          </div>
          <span className="font-medium">View Cart</span>
        </div>
        <span className="font-bold text-lg">
          {currencySymbol}{total.toFixed(2)}
        </span>
      </button>
    </div>
  );
}