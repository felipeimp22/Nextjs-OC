import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartOption {
  optionId: string;
  optionName: string;
  choiceId: string;
  choiceName: string;
  quantity?: number;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  selectedOptions: CartOption[];
  specialInstructions?: string;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;

  addItem: (item: Omit<CartItem, 'id'>, restaurantId: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

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
          const optionsTotal = item.selectedOptions.reduce(
            (sum, option) => sum + option.priceAdjustment * (option.quantity || 1),
            0
          );
          return total + (item.basePrice + optionsTotal) * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
