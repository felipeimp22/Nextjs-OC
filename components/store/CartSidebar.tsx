'use client';

import { useCartStore } from '@/stores/useCartStore';
import Button from '@/components/ui/Button';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartSidebarProps {
  currencySymbol: string;
  onCheckout: () => void;
}

export default function CartSidebar({ currencySymbol, onCheckout }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const isMobile = useIsMobile();

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${isMobile ? 'mb-6' : 'sticky top-6'}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h2>
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${isMobile ? 'mb-6' : 'sticky top-6'}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Your Cart ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})
      </h2>

      <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
        {items.map((item) => {
          const optionsTotal = item.selectedOptions.reduce(
            (sum, opt) => sum + opt.priceAdjustment * (opt.quantity || 1),
            0
          );
          const itemTotal = (item.basePrice + optionsTotal) * item.quantity;

          return (
            <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>

                  {item.selectedOptions.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {item.selectedOptions.map((opt, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {opt.choiceName}
                          {opt.priceAdjustment > 0 && (
                            <span className="text-gray-500">
                              {' '}
                              (+{currencySymbol}
                              {opt.priceAdjustment.toFixed(2)})
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}

                  {item.specialInstructions && (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  aria-label="Remove item"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-sm"
                  >
                    +
                  </button>
                </div>

                <p className="font-semibold text-gray-900">
                  {currencySymbol}
                  {itemTotal.toFixed(2)}
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
            {currencySymbol}
            {getTotal().toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-gray-500">Taxes and fees calculated at checkout</p>
      </div>

      <Button onClick={onCheckout} variant="primary" className="w-full mt-6">
        Proceed to Checkout
      </Button>
    </div>
  );
}
