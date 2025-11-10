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
          receipt_email: customerEmail,
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
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay ${currencySymbol}${total.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
