'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { FormSection, FormField, InfoCard } from '@/components/shared';
import { getFinancialSettings, updateFinancialSettings } from '@/lib/serverActions/settings.actions';
import { AMERICAS_CURRENCIES } from '@/lib/constants/currencies';
import { Trash2, Plus } from 'lucide-react';

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
  testMode: boolean;
}

export default function FinancialSettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.financial');
  const { showToast } = useToast();
  const restaurantId = params.id as string;

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
    testMode: true,
  });

  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  const [editingTaxIndex, setEditingTaxIndex] = useState<number | null>(null);

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
      setData({
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$',
        taxes: settings.taxes || [],
        globalFee: settings.globalFee || {
          enabled: true,
          threshold: 10,
          belowPercent: 10,
          aboveFlat: 1.95,
        },
        paymentProvider: settings.paymentProvider || 'stripe',
        stripeAccountId: settings.stripeAccountId,
        stripeConnectStatus: settings.stripeConnectStatus || 'not_connected',
        testMode: settings.testMode ?? true,
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
        testMode: data.testMode,
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

  const handleAddTax = () => {
    setEditingTax({
      name: '',
      enabled: true,
      rate: 0,
      type: 'percentage',
      applyTo: 'entire_order',
    });
    setEditingTaxIndex(null);
  };

  const handleEditTax = (index: number) => {
    setEditingTax(data.taxes[index]);
    setEditingTaxIndex(index);
  };

  const handleSaveTax = () => {
    if (!editingTax || !editingTax.name.trim()) {
      showToast('error', 'Tax name is required');
      return;
    }

    if (editingTaxIndex !== null) {
      // Update existing tax
      const updatedTaxes = [...data.taxes];
      updatedTaxes[editingTaxIndex] = editingTax;
      setData({ ...data, taxes: updatedTaxes });
    } else {
      // Add new tax
      setData({ ...data, taxes: [...data.taxes, editingTax] });
    }

    setEditingTax(null);
    setEditingTaxIndex(null);
  };

  const handleDeleteTax = (index: number) => {
    setData({
      ...data,
      taxes: data.taxes.filter((_, i) => i !== index),
    });
  };

  const handleCancelEdit = () => {
    setEditingTax(null);
    setEditingTaxIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Currency Section */}
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

      {/* Platform Fee Section */}
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

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Taxes Section */}
      <FormSection
        title="Taxes"
        description="Configure applicable taxes for your orders"
        actions={
          <Button
            onClick={handleAddTax}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tax
          </Button>
        }
      >
        {data.taxes.length === 0 && !editingTax && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            No taxes configured. Click "Add Tax" to create one.
          </div>
        )}

        {data.taxes.length > 0 && (
          <div className="space-y-3">
            {data.taxes.map((tax, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{tax.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${tax.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {tax.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>
                      {tax.type === 'percentage' ? `${tax.rate}%` : `${data.currencySymbol}${tax.rate.toFixed(2)}`}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{tax.applyTo === 'entire_order' ? 'Entire Order' : 'Per Item'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleEditTax(index)}
                    variant="ghost"
                    className="text-brand-red hover:text-brand-red/80"
                  >
                    Edit
                  </Button>
                  <button
                    onClick={() => handleDeleteTax(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tax Edit Form */}
        {editingTax && (
          <div className="mt-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
            <h4 className="font-semibold text-blue-900">
              {editingTaxIndex !== null ? 'Edit Tax' : 'Add New Tax'}
            </h4>

            <FormField label="Tax Name" required>
              <Input
                value={editingTax.name}
                onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })}
                placeholder="e.g., Sales Tax, VAT, etc."
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Type">
                <select
                  value={editingTax.type}
                  onChange={(e) =>
                    setEditingTax({
                      ...editingTax,
                      type: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </FormField>

              <FormField label={editingTax.type === 'percentage' ? 'Rate (%)' : `Amount (${data.currencySymbol})`}>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTax.rate}
                  onChange={(e) => setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </FormField>
            </div>

            <FormField label="Apply To">
              <select
                value={editingTax.applyTo}
                onChange={(e) =>
                  setEditingTax({
                    ...editingTax,
                    applyTo: e.target.value as 'entire_order' | 'per_item',
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
              >
                <option value="entire_order">Entire Order</option>
                <option value="per_item">Per Item</option>
              </select>
            </FormField>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tax-enabled"
                checked={editingTax.enabled}
                onChange={(e) => setEditingTax({ ...editingTax, enabled: e.target.checked })}
                className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
              />
              <label htmlFor="tax-enabled" className="text-sm font-medium text-gray-900">
                Enable this tax
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-blue-200">
              <Button onClick={handleSaveTax} className="bg-brand-red hover:bg-brand-red/90 text-white">
                {editingTaxIndex !== null ? 'Update Tax' : 'Add Tax'}
              </Button>
              <Button onClick={handleCancelEdit} variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </FormSection>

      {/* Payment Provider Section */}
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

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-8"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
