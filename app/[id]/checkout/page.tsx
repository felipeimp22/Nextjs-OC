'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/stores/useCartStore';
import { createOrder, createPaymentIntent, createOrderDraft } from '@/lib/serverActions/order.actions';
import { getPublicRestaurantData } from '@/lib/serverActions/order.actions';
import CheckoutForm from '@/components/store/CheckoutForm';
import PaymentForm from '@/components/store/PaymentForm';
import { useToast } from '@/components/ui/ToastContainer';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { AddressComponents } from '@/lib/utils/mapbox';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const { showToast } = useToast();
  const t = useTranslations('checkout');

  const { items, clearCart } = useCartStore();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<AddressComponents | null>(null);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const [step, setStep] = useState<'info' | 'payment' | 'confirmation'>('info');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripePromise, setStripePromise] = useState<any>(null);

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
      showToast('error', result.error || 'Restaurant not found');
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
      showToast('error', draftResult.error || 'Failed to calculate order');
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

  const handleCheckoutSubmit = async (info: CustomerInfo) => {
    setCustomerInfo(info);

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

    const orderResult = await createOrder({
      restaurantId,
      items: orderItems,
      orderType,
      customerName: info.name,
      customerEmail: info.email,
      customerPhone: info.phone,
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
    });

    if (!orderResult.success || !orderResult.data) {
      showToast('error', orderResult.error || 'Failed to create order');
      return;
    }

    const paymentResult = await createPaymentIntent(orderResult.data.id);

    if (!paymentResult.success || !paymentResult.data) {
      showToast('error', paymentResult.error || 'Failed to initialize payment');
      return;
    }

    const { clientSecret, publicKey, accountType, stripeAccountId } = paymentResult.data;

    if (!clientSecret || !publicKey) {
      showToast('error', 'Payment configuration error');
      return;
    }

    setClientSecret(clientSecret);

    const stripe = await loadStripe(publicKey, stripeAccountId ? {
      stripeAccount: stripeAccountId,
    } : {});

    if (!stripe) {
      showToast('error', 'Failed to initialize Stripe');
      return;
    }

    setStripePromise(stripe);
    setStep('payment');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const { primary: primaryColor, secondary: secondaryColor } = restaurant.colors;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with restaurant branding */}
      <div
        className="py-4 px-4 shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href={`/${restaurantId}/store`}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t('backToStore')}</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {t('title')}
              </h1>
              <p className="text-white/80 text-sm">{restaurant.name}</p>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Checkout Steps Indicator */}
        <CheckoutSteps currentStep={step} />

        {step === 'info' ? (
          <CheckoutForm
            orderType={orderType}
            onOrderTypeChange={handleOrderTypeChange}
            deliveryEnabled={restaurant.deliveryEnabled}
            onDeliveryAddressChange={handleDeliveryAddressChange}
            currencySymbol={restaurant.currencySymbol}
            orderSummary={orderSummary}
            isLoadingCalculation={isCalculating}
            onSubmit={handleCheckoutSubmit}
          />
        ) : (
          stripePromise && clientSecret && customerInfo && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: primaryColor,
                  },
                },
              }}
            >
              <PaymentForm
                currencySymbol={restaurant.currencySymbol}
                total={orderSummary?.total || 0}
                customerEmail={customerInfo.email}
              />
            </Elements>
          )
        )}
      </div>
    </div>
  );
}