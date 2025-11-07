'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { getFinancialSettings, updateFinancialSettings } from '@/lib/serverActions/settings.actions';
import { Trash2 } from 'lucide-react';

interface TaxSetting {
  id?: string;
  name: string;
  type: 'percentage' | 'fixed';
  rate: number | null;
  fixedAmount: number | null;
  applyToEntireOrder: boolean;
}

interface FinancialData {
  currencyCode: string;
  currencySymbol: string;
  taxes: TaxSetting[];
  platformFeeThreshold: number;
  platformFeeBelowThreshold: number;
  platformFeeAboveThreshold: number;
  paymentProvider: string;
  stripeConnectedAccountId: string | null;
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
    currencyCode: 'USD',
    currencySymbol: '$',
    taxes: [],
    platformFeeThreshold: 50,
    platformFeeBelowThreshold: 5,
    platformFeeAboveThreshold: 2.5,
    paymentProvider: 'stripe',
    stripeConnectedAccountId: null,
    testMode: true,
  });

  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);

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
        currencyCode: settings.currencyCode || 'USD',
        currencySymbol: settings.currencySymbol || '$',
        taxes: settings.taxes || [],
        platformFeeThreshold: settings.globalFee?.threshold ?? 50,
        platformFeeBelowThreshold: settings.globalFee?.belowPercent ?? 5,
        platformFeeAboveThreshold: settings.globalFee?.aboveFlat ?? 2.5,
        paymentProvider: settings.paymentProvider || 'stripe',
        stripeConnectedAccountId: settings.stripeConnectedAccountId,
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
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        taxes: data.taxes,
        globalFee: {
          enabled: true,
          threshold: data.platformFeeThreshold,
          belowPercent: data.platformFeeBelowThreshold,
          aboveFlat: data.platformFeeAboveThreshold,
        },
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
      type: 'percentage',
      rate: 0,
      fixedAmount: null,
      applyToEntireOrder: true,
    });
  };

  const handleSaveTax = () => {
    if (!editingTax || !editingTax.name) return;

    if (editingTax.id) {
      setData({
        ...data,
        taxes: data.taxes.map((tax) =>
          tax.id === editingTax.id ? editingTax : tax
        ),
      });
    } else {
      setData({
        ...data,
        taxes: [...data.taxes, { ...editingTax, id: Date.now().toString() }],
      });
    }

    setEditingTax(null);
  };

  const handleDeleteTax = (id: string) => {
    setData({
      ...data,
      taxes: data.taxes.filter((tax) => tax.id !== id),
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Currency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency Code
            </label>
            <Input
              value={data.currencyCode}
              onChange={(e) => setData({ ...data, currencyCode: e.target.value })}
              placeholder="USD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency Symbol
            </label>
            <Input
              value={data.currencySymbol}
              onChange={(e) => setData({ ...data, currencySymbol: e.target.value })}
              placeholder="$"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Taxes
          </h3>
          <Button
            onClick={handleAddTax}
            className="bg-brand-red hover:bg-brand-red/90 text-white text-sm px-4 py-2"
          >
            + Add Tax
          </Button>
        </div>

        <div className="space-y-3">
          {data.taxes.map((tax) => (
            <div
              key={tax.id}
              className="bg-gray-50 border border-gray-200 rounded-md p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-gray-900 font-medium">{tax.name}</div>
                <div className="text-sm text-gray-600">
                  {tax.type === 'percentage'
                    ? `$${tax.rate}%`
                    : `$${tax.fixedAmount?.toFixed(2)}`}
                  {' • '}
                  {tax.applyToEntireOrder ? 'Entire Order' : 'Per Item'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTax(tax)}
                  className="text-brand-red hover:text-brand-red/80 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTax(tax.id!)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {data.taxes.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
              No taxes configured
            </div>
          )}
        </div>

        {editingTax && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Name
              </label>
              <Input
                value={editingTax.name}
                onChange={(e) =>
                  setEditingTax({ ...editingTax, name: e.target.value })
                }
                placeholder="Sales Tax"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={editingTax.type}
                  onChange={(e) =>
                    setEditingTax({
                      ...editingTax,
                      type: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingTax.type === 'percentage' ? 'Rate (%)' : 'Amount ($)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTax.type === 'percentage' ? (editingTax.rate || 0) : (editingTax.fixedAmount || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (editingTax.type === 'percentage') {
                      setEditingTax({ ...editingTax, rate: val });
                    } else {
                      setEditingTax({ ...editingTax, fixedAmount: val });
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply To
              </label>
              <select
                value={editingTax.applyToEntireOrder ? 'entire' : 'perItem'}
                onChange={(e) =>
                  setEditingTax({
                    ...editingTax,
                    applyToEntireOrder: e.target.value === 'entire',
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="entire">Entire Order</option>
                <option value="perItem">Per Item</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setEditingTax(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTax}
                className="bg-brand-red hover:bg-brand-red/90 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Platform Fee (Always Enabled)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Threshold ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={data.platformFeeThreshold}
              onChange={(e) =>
                setData({
                  ...data,
                  platformFeeThreshold: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Below Threshold (%)
            </label>
            <Input
              type="number"
              step="0.1"
              value={data.platformFeeBelowThreshold}
              onChange={(e) =>
                setData({
                  ...data,
                  platformFeeBelowThreshold: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Above Threshold ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={data.platformFeeAboveThreshold}
              onChange={(e) =>
                setData({
                  ...data,
                  platformFeeAboveThreshold: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Payment Provider
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={data.paymentProvider}
              onChange={(e) =>
                setData({ ...data, paymentProvider: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <option value="stripe">Stripe</option>
              <option value="mercadopago">Mercado Pago</option>
            </select>
          </div>

          {data.paymentProvider === 'stripe' && data.stripeConnectedAccountId && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2 text-green-700 font-medium">
                ✓ Stripe Connected
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Account ID: {data.stripeConnectedAccountId}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
