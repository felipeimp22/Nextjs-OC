'use client';

import { useCartStore } from '@/stores/useCartStore';
import { Button } from '@/components/ui/Button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';

interface CartSidebarProps {
  currencySymbol: string;
  onCheckout: () => void;
}

export default function CartSidebar({ currencySymbol, onCheckout }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, getItemPrice } = useCartStore();
  const isMobile = useIsMobile();

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 ${isMobile ? 'mb-6' : ''}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h2>
        <div className="text-center py-8">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${isMobile ? 'mb-6' : ''}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Your Cart ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})
      </h2>

      <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
        {items.map((item) => {
          const itemTotal = getItemPrice(item.id);

          return (
            <div key={item.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>

                  {item.selectedOptions.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.selectedOptions.map((opt, idx) => (
                        <p key={idx} className="text-xs text-gray-500">
                          • {opt.choiceName}
                        </p>
                      ))}
                    </div>
                  )}

                  {item.specialInstructions && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {item.specialInstructions}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <p className="font-semibold text-gray-900">
                  {currencySymbol}{itemTotal.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>
            {currencySymbol}{getTotal().toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500">Taxes and fees calculated at checkout</p>
      </div>

      <Button onClick={onCheckout} variant="primary" className="w-full mt-6">
        Proceed to Checkout
      </Button>
    </div>
  );
}