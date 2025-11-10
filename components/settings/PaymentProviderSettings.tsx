'use client';

import { useState } from 'react';
import { Button, Card, Toggle, useToast } from '@/components/ui';
import { createStripeOnboardingLink } from '@/lib/serverActions/settings.actions';

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
      const result = await createStripeOnboardingLink(restaurantId);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        showToast('error', result.error || 'Failed to connect Stripe');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to connect Stripe');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Stripe Connect</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                    Accept credit card payments directly to your account
                  </p>
                </div>
              </div>
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
                      className="mt-3 bg-[#635BFF] hover:bg-[#5851DF] text-white"
                    >
                      {isConnecting ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Connecting...
                        </span>
                      ) : (
                        'Continue Onboarding'
                      )}
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
                  className="bg-[#635BFF] hover:bg-[#5851DF] text-white"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Connecting...
                    </span>
                  ) : (
                    'Connect Stripe Account'
                  )}
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

      <Card className="overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-[#00B1EA]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.185 7.4h-3.228c-.255 0-.461.206-.461.461v6.281c0 1.401-.866 2.175-2.185 2.175-1.318 0-2.185-.774-2.185-2.175V7.861c0-.255-.206-.461-.461-.461H3.437c-.255 0-.461.206-.461.461v6.362c0 2.988 2.179 4.927 5.369 4.927 3.189 0 5.369-1.939 5.369-4.927V7.861c0-.255-.206-.461-.461-.461h.932zm5.369 0h-3.228c-.255 0-.461.206-.461.461v10.372c0 .255.206.461.461.461h3.228c.255 0 .461-.206.461-.461V7.861c0-.255-.206-.461-.461-.461z"/>
                </svg>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">MercadoPago</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                    Accept payments for Latin American markets
                  </p>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-blue-100 text-blue-700">
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
