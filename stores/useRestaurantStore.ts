import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RestaurantStore {
  selectedRestaurantId: string | null;
  selectedRestaurantName: string | null;
  setSelectedRestaurant: (id: string, name: string) => void;
  clearSelectedRestaurant: () => void;
}

export const useRestaurantStore = create<RestaurantStore>()(
  persist(
    (set) => ({
      selectedRestaurantId: null,
      selectedRestaurantName: null,
      setSelectedRestaurant: (id, name) =>
        set({ selectedRestaurantId: id, selectedRestaurantName: name }),
      clearSelectedRestaurant: () =>
        set({ selectedRestaurantId: null, selectedRestaurantName: null }),
    }),
    {
      name: 'restaurant-storage',
    }
  )
);
