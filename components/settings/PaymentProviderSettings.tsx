'use client';

import { useState } from 'react';
import { Button, Card, Toggle, useToast } from '@/components/ui';

interface PaymentProviderSettingsProps {
  restaurantId: string;
  financialSettings: any;
  onUpdate: () => void;
}

export default function PaymentProviderSettings({
  restaurantId,
  financialSettings,
  onUpdate,
}: PaymentProviderSettingsProps) {
  const { showToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      connected: { bg: 'bg-green-100', text: 'text-green-800', label: 'Connected' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      not_connected: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Not Connected' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      restricted: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Restricted' },
    };

    const config = statusConfig[status] || statusConfig.not_connected;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);

    try {
      const response = await fetch('/api/stripe/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        showToast('error', data.error || 'Failed to connect Stripe');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to connect Stripe');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stripe Connect</h3>
              <p className="text-sm text-gray-600 mt-1">
                Accept credit card payments directly to your Stripe account
              </p>
            </div>
            {financialSettings?.stripeConnectStatus &&
              getStatusBadge(financialSettings.stripeConnectStatus)}
          </div>

          <div className="space-y-4">
            {financialSettings?.stripeConnectStatus === 'connected' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Stripe account connected</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your Stripe account is ready to accept payments. Payments will go directly
                      to your account with platform fees automatically deducted.
                    </p>
                    {financialSettings.stripeAccountId && (
                      <p className="text-sm text-green-700 mt-2">
                        Account ID: {financialSettings.stripeAccountId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : financialSettings?.stripeConnectStatus === 'pending' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">Onboarding incomplete</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your Stripe account is created but onboarding is not complete. Click below
                      to continue setup.
                    </p>
                    <Button
                      onClick={handleConnectStripe}
                      variant="primary"
                      disabled={isConnecting}
                      className="mt-3"
                    >
                      {isConnecting ? 'Loading...' : 'Continue Onboarding'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Stripe account to accept payments. You'll be redirected to Stripe
                  to complete a secure onboarding process.
                </p>
                <Button
                  onClick={handleConnectStripe}
                  variant="primary"
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Loading...' : 'Connect Stripe Account'}
                </Button>
              </div>
            )}

            {financialSettings?.usePlatformAccountFallback !== undefined && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Platform Account Fallback</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow platform to process payments if your Stripe account is not connected
                    </p>
                  </div>
                  <Toggle
                    checked={financialSettings.usePlatformAccountFallback}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">MercadoPago (Coming Soon)</h3>
              <p className="text-sm text-gray-600 mt-1">
                Accept payments via MercadoPago for Latin American markets
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              Coming Soon
            </span>
          </div>

          <p className="text-sm text-gray-500">
            MercadoPago integration is currently in development and will be available soon.
          </p>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="font-medium text-blue-900">How Payment Processing Works</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Customer payments go directly to your connected payment account</li>
              <li>Platform fees are automatically deducted from each transaction</li>
              <li>You receive payouts according to your payment provider's schedule</li>
              <li>All transactions are secure and PCI compliant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
