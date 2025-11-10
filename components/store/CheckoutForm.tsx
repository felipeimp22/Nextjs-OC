'use client';

import { useState } from 'react';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import LocationAutocomplete from '@/components/shared/LocationAutocomplete';
import { ValidationInput } from '@/components/shared/ValidationInput';
import type { AddressComponents } from '@/lib/utils/mapbox';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface CheckoutFormProps {
  orderType: 'pickup' | 'delivery';
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
  onSubmit: (customerInfo: CustomerInfo) => Promise<void>;
}

export default function CheckoutForm({
  orderType,
  onOrderTypeChange,
  deliveryEnabled,
  onDeliveryAddressChange,
  currencySymbol,
  orderSummary,
  isLoadingCalculation,
  onSubmit,
}: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await onSubmit(customerInfo);
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
            <ValidationInput
              type="email"
              value={customerInfo.email}
              onChange={(value, isValid) => {
                setCustomerInfo({ ...customerInfo, email: value });
                setIsEmailValid(isValid);
              }}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <ValidationInput
              type="phone"
              value={customerInfo.phone}
              onChange={(value, isValid) => {
                setCustomerInfo({ ...customerInfo, phone: value });
                setIsPhoneValid(isValid);
              }}
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

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isProcessing || isLoadingCalculation || !orderSummary || !isEmailValid || !isPhoneValid}
      >
        {isProcessing ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </form>
  );
}
