'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationAutocomplete from './LocationAutocomplete';
import type { AddressComponents } from '@/lib/utils/mapbox';

interface CheckoutFormProps {
  orderType: 'pickup' | 'delivery' | 'dine_in';
  onOrderTypeChange: (type: 'pickup' | 'delivery') => void;
  deliveryEnabled: boolean;
  onDeliveryAddressChange?: (address: AddressComponents) => void;
  currencySymbol: string;
  orderSummary: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    platformFee: number;
    tip: number;
    total: number;
    taxBreakdown: any[];
  } | null;
  isLoadingCalculation: boolean;
}

export default function CheckoutForm({
  orderType,
  onOrderTypeChange,
  deliveryEnabled,
  onDeliveryAddressChange,
  currencySymbol,
  orderSummary,
  isLoadingCalculation,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirmation`,
          receipt_email: customerInfo.email,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Type</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onOrderTypeChange('pickup')}
            className={`p-4 rounded-lg border-2 transition-all ${
              orderType === 'pickup'
                ? 'border-brand-navy bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <span className="font-semibold">Pickup</span>
            </div>
          </button>

          {deliveryEnabled && (
            <button
              type="button"
              onClick={() => onOrderTypeChange('delivery')}
              className={`p-4 rounded-lg border-2 transition-all ${
                orderType === 'delivery'
                  ? 'border-brand-navy bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                </svg>
                <span className="font-semibold">Delivery</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <Input
              value={customerInfo.name}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, name: e.target.value })
              }
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              type="email"
              value={customerInfo.email}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, email: e.target.value })
              }
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <Input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, phone: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>
        </div>
      </div>

      {orderType === 'delivery' && onDeliveryAddressChange && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
          <LocationAutocomplete
            onSelect={onDeliveryAddressChange}
            placeholder="Enter your delivery address with house number..."
            required
          />
        </div>
      )}

      {orderSummary && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-700">
              <span>Subtotal</span>
              <span>
                {currencySymbol}
                {orderSummary.subtotal.toFixed(2)}
              </span>
            </div>

            {orderSummary.taxBreakdown.map((tax: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-gray-700">
                <span>{tax.name}</span>
                <span>
                  {currencySymbol}
                  {tax.amount.toFixed(2)}
                </span>
              </div>
            ))}

            {orderType === 'delivery' && orderSummary.deliveryFee > 0 && (
              <div className="flex items-center justify-between text-gray-700">
                <span>Delivery Fee</span>
                <span>
                  {currencySymbol}
                  {orderSummary.deliveryFee.toFixed(2)}
                </span>
              </div>
            )}

            {orderSummary.platformFee > 0 && (
              <div className="flex items-center justify-between text-gray-700">
                <span>Platform Fee</span>
                <span>
                  {currencySymbol}
                  {orderSummary.platformFee.toFixed(2)}
                </span>
              </div>
            )}

            {orderSummary.tip > 0 && (
              <div className="flex items-center justify-between text-gray-700">
                <span>Tip</span>
                <span>
                  {currencySymbol}
                  {orderSummary.tip.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {currencySymbol}
                  {orderSummary.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>

        <div className="mb-4">
          <PaymentElement />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900">
            <strong>Test Card Numbers:</strong>
            <br />
            Success: 4242 4242 4242 4242
            <br />
            Failure: 4000 0000 0000 0002
            <br />
            Use any future expiry date and any 3-digit CVC
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-900">{errorMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={!stripe || isProcessing || isLoadingCalculation}
        >
          {isProcessing ? 'Processing...' : `Pay ${currencySymbol}${orderSummary?.total.toFixed(2) || '0.00'}`}
        </Button>
      </div>
    </form>
  );
}
