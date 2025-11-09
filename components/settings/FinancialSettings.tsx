'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { FormSection, FormField, InfoCard } from '@/components/shared';
import { TaxManagementSection } from '@/components/settings/financial';
import { getFinancialSettings, updateFinancialSettings } from '@/lib/serverActions/settings.actions';
import { AMERICAS_CURRENCIES } from '@/lib/constants/currencies';

interface TaxSetting {
  name: string;
  enabled: boolean;
  rate: number;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

interface FinancialData {
  currency: string;
  currencySymbol: string;
  taxes: TaxSetting[];
  globalFee: {
    enabled: boolean;
    threshold: number;
    belowPercent: number;
    aboveFlat: number;
  };
  paymentProvider: string;
  stripeAccountId: string | null;
  stripeConnectStatus: string;
}

interface FinancialSettingsProps {
  restaurantId: string;
}

export function FinancialSettings({ restaurantId }: FinancialSettingsProps) {
  const t = useTranslations('settings.financial');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FinancialData>({
    currency: 'USD',
    currencySymbol: '$',
    taxes: [],
    globalFee: {
      enabled: true,
      threshold: 10,
      belowPercent: 10,
      aboveFlat: 1.95,
    },
    paymentProvider: 'stripe',
    stripeAccountId: null,
    stripeConnectStatus: 'not_connected',
  });

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const result = await getFinancialSettings(restaurantId);

      if (!result.success || !result.data) {
        setLoading(false);
        return;
      }

      const settings = result.data;

      const typedTaxes: TaxSetting[] = (settings.taxes || []).map((tax: any) => ({
        name: tax.name,
        enabled: tax.enabled,
        rate: tax.rate,
        type: tax.type as 'percentage' | 'fixed',
        applyTo: tax.applyTo as 'entire_order' | 'per_item',
      }));

      setData({
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$',
        taxes: typedTaxes,
        globalFee: settings.globalFee || {
          enabled: true,
          threshold: 10,
          belowPercent: 10,
          aboveFlat: 1.95,
        },
        paymentProvider: settings.paymentProvider || 'stripe',
        stripeAccountId: settings.stripeAccountId,
        stripeConnectStatus: settings.stripeConnectStatus || 'not_connected',
      });
    } catch (error) {
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateFinancialSettings(restaurantId, {
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        taxes: data.taxes,
        globalFee: data.globalFee,
        paymentProvider: data.paymentProvider,
      });

      if (!result.success) {
        showToast('error', result.error || 'Failed to save settings');
        return;
      }

      showToast('success', 'Settings saved successfully!');
      await fetchSettings();
    } catch (error) {
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      <FormSection title="Currency Settings" description="Select your operating currency">
        <FormField label="Currency" required description="Select the currency for your restaurant">
          <select
            value={data.currency}
            onChange={(e) => {
              const selected = AMERICAS_CURRENCIES.find(c => c.code === e.target.value);
              if (selected) {
                setData({
                  ...data,
                  currency: selected.code,
                  currencySymbol: selected.symbol,
                });
              }
            }}
            className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
          >
            {AMERICAS_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} ({currency.symbol}) - {currency.name}
              </option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title="Platform Fee" description="Automatically configured for your restaurant">
        <InfoCard type="info" title="How Platform Fee Works">
          <p className="mb-2">
            The platform fee is automatically applied to all orders and helps maintain the service.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Orders below ${data.globalFee.threshold}: {data.globalFee.belowPercent}% of order total</li>
            <li>Orders ${data.globalFee.threshold} or above: ${data.globalFee.aboveFlat.toFixed(2)} flat fee</li>
          </ul>
        </InfoCard>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <FormField label="Threshold Amount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {data.currencySymbol}
              </span>
              <Input
                type="number"
                value={data.globalFee.threshold}
                disabled
                className="pl-7 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </FormField>

          <FormField label="Below Threshold">
            <div className="relative">
              <Input
                type="number"
                value={data.globalFee.belowPercent}
                disabled
                className="pr-7 bg-gray-50 cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </FormField>

          <FormField label="Above Threshold">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {data.currencySymbol}
              </span>
              <Input
                type="number"
                value={data.globalFee.aboveFlat}
                disabled
                className="pl-7 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <TaxManagementSection
        taxes={data.taxes}
        currencySymbol={data.currencySymbol}
        onTaxesChange={(taxes) => setData({ ...data, taxes })}
      />

      <FormSection title="Payment Provider">
        <FormField label="Provider">
          <select
            value={data.paymentProvider}
            onChange={(e) => setData({ ...data, paymentProvider: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
          >
            <option value="stripe">Stripe</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </FormField>

        {data.paymentProvider === 'stripe' && data.stripeConnectStatus === 'connected' && data.stripeAccountId && (
          <InfoCard type="success" title="Stripe Connected" className="mt-4">
            <p>Account ID: <span className="font-mono text-xs">{data.stripeAccountId}</span></p>
          </InfoCard>
        )}

        {data.paymentProvider === 'stripe' && data.stripeConnectStatus !== 'connected' && (
          <InfoCard type="warning" className="mt-4">
            Stripe account not yet connected. Please complete the Stripe Connect setup to accept payments.
          </InfoCard>
        )}
      </FormSection>

      <div className="flex justify-end pt-4 md:pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6 md:px-8 w-full md:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
