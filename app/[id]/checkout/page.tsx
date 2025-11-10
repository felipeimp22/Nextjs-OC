'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/stores/useCartStore';
import { createOrder, createPaymentIntent, createOrderDraft } from '@/lib/serverActions/order.actions';
import { getPublicRestaurantData } from '@/lib/serverActions/order.actions';
import CheckoutForm from '@/components/store/CheckoutForm';
import { useToast } from '@/components/ui/ToastContainer';
import type { AddressComponents } from '@/lib/utils/mapbox';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const { showToast } = useToast();

  const { items, clearCart } = useCartStore();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<AddressComponents | null>(null);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      router.push(`/${restaurantId}/store`);
      return;
    }

    loadData();
  }, [restaurantId]);

  useEffect(() => {
    if (orderType === 'delivery' && deliveryAddress) {
      calculateOrderSummary();
    } else if (orderType === 'pickup') {
      calculateOrderSummary();
    }
  }, [orderType, deliveryAddress]);

  const loadData = async () => {
    setIsLoading(true);

    const result = await getPublicRestaurantData(restaurantId);

    if (result.success && result.data) {
      setRestaurant(result.data);
    } else {
      showToast(result.error || 'Restaurant not found', 'error');
      router.push(`/${restaurantId}/store`);
      return;
    }

    setIsLoading(false);
  };

  const calculateOrderSummary = async () => {
    if (!restaurant) return;

    setIsCalculating(true);

    const orderItems = items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions.map((opt) => ({
        optionId: opt.optionId,
        choiceId: opt.choiceId,
        quantity: opt.quantity || 1,
      })),
      specialInstructions: item.specialInstructions,
    }));

    const draftResult = await createOrderDraft({
      restaurantId,
      items: orderItems,
      orderType,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: deliveryAddress ? {
        street: deliveryAddress.street,
        houseNumber: deliveryAddress.houseNumber,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        country: deliveryAddress.country,
        fullAddress: deliveryAddress.fullAddress,
      } : undefined,
      customerLocation: deliveryAddress ? deliveryAddress.coordinates : undefined,
      deliveryDistance: deliveryAddress ? undefined : 0,
    });

    if (draftResult.success && draftResult.data) {
      setOrderSummary(draftResult.data);
    } else {
      showToast(draftResult.error || 'Failed to calculate order', 'error');
    }

    setIsCalculating(false);
  };

  const handleOrderTypeChange = (type: 'pickup' | 'delivery') => {
    setOrderType(type);
    if (type === 'pickup') {
      setDeliveryAddress(null);
    }
  };

  const handleDeliveryAddressChange = (address: AddressComponents) => {
    setDeliveryAddress(address);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe' as const,
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="py-6 px-4 shadow-md"
        style={{ backgroundColor: restaurant.colors.primary }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Checkout</h1>
          <p className="text-white/90 mt-1">{restaurant.name}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {stripePromise && stripeOptions ? (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <CheckoutForm
              orderType={orderType}
              onOrderTypeChange={handleOrderTypeChange}
              deliveryEnabled={restaurant.deliveryEnabled}
              onDeliveryAddressChange={handleDeliveryAddressChange}
              currencySymbol={restaurant.currencySymbol}
              orderSummary={orderSummary}
              isLoadingCalculation={isCalculating}
            />
          </Elements>
        ) : (
          <CheckoutForm
            orderType={orderType}
            onOrderTypeChange={handleOrderTypeChange}
            deliveryEnabled={restaurant.deliveryEnabled}
            onDeliveryAddressChange={handleDeliveryAddressChange}
            currencySymbol={restaurant.currencySymbol}
            orderSummary={orderSummary}
            isLoadingCalculation={isCalculating}
          />
        )}
      </div>
    </div>
  );
}
