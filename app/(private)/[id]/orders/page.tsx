'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useOrders } from '@/hooks/useOrders';
import OrderModal from '@/components/shared/OrderModal';
import OrdersList from '@/components/orders/OrdersList';
import { useQuery } from '@tanstack/react-query';
import { getRestaurantMenuData } from '@/lib/serverActions/menu.actions';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
    specialInstructions?: string;
  }>;
  specialInstructions?: string;
  customerAddress?: any;
  driverTip?: number;
  prepTime?: number;
  scheduledPickupTime?: string | Date;
  deliveryInfo?: {
    provider?: string;
    externalId?: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const queryClient = useQueryClient();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useOrders(restaurantId);

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['restaurantMenuData', restaurantId],
    queryFn: async () => {
      const result = await getRestaurantMenuData(restaurantId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!selectedRestaurantId && selectedRestaurantId === restaurantId,
  });

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/orders`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOrderSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
  };

  const handleCloseModal = () => {
    setIsOrderModalOpen(false);
    setEditingOrder(null);
  };

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  return (
    <>
      <OrdersList
        orders={orders}
        currencySymbol={menuData?.currencySymbol || '$'}
        onEdit={handleEdit}
      />

      {menuData && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={handleCloseModal}
          restaurantId={restaurantId}
          menuItems={menuData.menuItems || []}
          options={menuData.options || []}
          menuRules={menuData.menuRules || []}
          currencySymbol={menuData.currencySymbol || '$'}
          taxSettings={menuData.taxSettings || []}
          globalFeeSettings={menuData.globalFeeSettings || null}
          deliverySettings={menuData.deliverySettings || null}
          restaurantTimezone={menuData.timezone}
          onOrderSaved={handleOrderSaved}
          existingOrder={editingOrder ? {
            id: editingOrder.id,
            customerName: editingOrder.customerName,
            customerPhone: editingOrder.customerPhone,
            customerEmail: editingOrder.customerEmail,
            orderType: editingOrder.orderType as 'pickup' | 'delivery' | 'dine_in',
            paymentStatus: editingOrder.paymentStatus as 'pending' | 'paid',
            paymentMethod: editingOrder.paymentMethod as 'card' | 'cash' | 'other',
            deliveryAddress: editingOrder.customerAddress?.address || editingOrder.customerAddress?.fullAddress,
            specialInstructions: editingOrder.specialInstructions,
            prepTime: editingOrder.prepTime,
            driverTip: editingOrder.driverTip,
            scheduledPickupTime: editingOrder.scheduledPickupTime,
            deliveryInfo: editingOrder.deliveryInfo,
            items: editingOrder.items,
          } : undefined}
        />
      )}
    </>
  );
}
