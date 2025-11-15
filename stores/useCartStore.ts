import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateItemTotalPrice } from '@/lib/utils/modifierPricingCalculator';

export interface CartOption {
  optionId: string;
  optionName: string;
  choiceId: string;
  choiceName: string;
  quantity?: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  selectedOptions: CartOption[];
  menuRules: any[] | null;
  specialInstructions?: string;
  image?: string;
  addedAt?: number;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;

  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>, restaurantId: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemPrice: (itemId: string) => number;
}

/**
 * Calculate cart item price using centralized calculation logic
 * Handles cross-option pricing adjustments (multiplier, addition, fixed)
 */
const calculateCartItemPrice = (item: CartItem): number => {
  if (!item.menuRules || item.selectedOptions.length === 0) {
    return item.basePrice * item.quantity;
  }

  const selectedChoices = item.selectedOptions.map(opt => ({
    optionId: opt.optionId,
    choiceId: opt.choiceId,
    quantity: opt.quantity || 1,
  }));

  try {
    const result = calculateItemTotalPrice(
      item.basePrice,
      { appliedOptions: item.menuRules },
      selectedChoices,
      item.quantity
    );
    return result.total;
  } catch (error) {
    console.warn('Price calculation failed, using fallback:', error);
    // Fallback to base price if calculation fails
    return item.basePrice * item.quantity;
  }
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,

      addItem: (item, restaurantId) => {
        set((state) => {
          if (state.restaurantId && state.restaurantId !== restaurantId) {
            return {
              items: [{
                ...item,
                id: crypto.randomUUID(),
                addedAt: Date.now(),
              }],
              restaurantId,
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id: crypto.randomUUID(),
                addedAt: Date.now(),
              },
            ],
            restaurantId,
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      updateItem: (itemId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], restaurantId: null });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          return total + calculateCartItemPrice(item);
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      getItemPrice: (itemId: string) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);
        return item ? calculateCartItemPrice(item) : 0;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
