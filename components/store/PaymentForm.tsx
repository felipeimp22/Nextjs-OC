'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';

interface PaymentFormProps {
  currencySymbol: string;
  total: number;
  customerEmail: string;
}

export default function PaymentForm({
  currencySymbol,
  total,
  customerEmail,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not loaded');
      return;
    }

    if (!isElementReady) {
      setErrorMessage('Payment form is still loading. Please wait a moment.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirmation`,
          receipt_email: customerEmail,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>

        <div className="mb-4">
          {!isElementReady && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading payment form...</span>
            </div>
          )}
          <div className={!isElementReady ? 'hidden' : ''}>
            <PaymentElement
              onReady={() => {
                console.log('✅ PaymentElement ready');
                setIsElementReady(true);
              }}
              onLoadError={(error: any) => {
                console.error('❌ PaymentElement load error:', error);
                console.error('❌ Error type:', typeof error);
                console.error('❌ Error keys:', Object.keys(error || {}));
                console.error('❌ Error stringified:', JSON.stringify(error, null, 2));

                // Extract the actual error message from the Stripe error object
                const errorMessage = error?.error?.message || error?.message || 'Please check your Stripe configuration and try again.';
                setErrorMessage(`Failed to load payment form. ${errorMessage}`);
              }}
              onChange={(event) => {
                if (event.complete) {
                  console.log('✅ PaymentElement completed');
                } else if (event.empty) {
                  console.log('⚠️ PaymentElement empty');
                }
              }}
            />
          </div>
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
          disabled={!stripe || !isElementReady || isProcessing}
        >
          {!isElementReady ? 'Loading payment form...' : isProcessing ? 'Processing...' : `Pay ${currencySymbol}${total.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
