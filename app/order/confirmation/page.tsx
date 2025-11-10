'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { getOrderByPaymentIntent } from '@/lib/serverActions/order.actions';

interface OrderData {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantInfo: {
    name: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (!paymentIntentId) {
      setError('Payment information not found');
      setLoading(false);
      return;
    }

    loadOrderDetails();
  }, [paymentIntentId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const result = await getOrderByPaymentIntent(paymentIntentId!);

      if (result.success && result.data) {
        setOrder(result.data as OrderData);
      } else {
        setError(result.error || 'Failed to load order details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'We could not find your order details.'}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = redirectStatus === 'succeeded' && order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className={`p-6 md:p-8 ${isPaymentSuccessful ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isPaymentSuccessful ? 'bg-green-100' : 'bg-yellow-100'} mb-4`}>
                {isPaymentSuccessful ? (
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-8 w-8 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isPaymentSuccessful ? 'text-green-900' : 'text-yellow-900'}`}>
                {isPaymentSuccessful ? 'Order Confirmed!' : 'Payment Processing'}
              </h1>
              <p className={`text-sm md:text-base ${isPaymentSuccessful ? 'text-green-700' : 'text-yellow-700'}`}>
                {isPaymentSuccessful
                  ? `Thank you for your order, ${order.customerName}!`
                  : 'Your payment is being processed. This may take a few moments.'}
              </p>
              <p className="text-lg md:text-xl font-semibold text-gray-900 mt-4">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm md:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900 capitalize">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{order.orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Restaurant</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm md:text-base">
                <p className="font-medium text-gray-900">{order.restaurantInfo.name}</p>
                <p className="text-gray-600 mt-1">{order.restaurantInfo.phone}</p>
                <p className="text-gray-600 mt-1">
                  {order.restaurantInfo.address.street}, {order.restaurantInfo.address.city}, {order.restaurantInfo.address.state} {order.restaurantInfo.address.zipCode}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Information</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm md:text-base">
                <p className="font-medium text-gray-900">{order.customerName}</p>
                <p className="text-gray-600 mt-1">{order.customerEmail}</p>
                <p className="text-gray-600 mt-1">{order.customerPhone}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Items</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start bg-gray-50 rounded-lg p-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm md:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="text-gray-900">${order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {order.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tip:</span>
                    <span className="text-gray-900">${order.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {isPaymentSuccessful && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>What's next?</strong>
                  <br />
                  You will receive a confirmation email at {order.customerEmail} with your order details.
                  The restaurant will start preparing your order shortly.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => router.push(`/${order.restaurantId}/store`)}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Return to Store
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
