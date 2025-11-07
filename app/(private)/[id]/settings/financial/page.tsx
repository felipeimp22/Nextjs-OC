'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Toggle } from '@/components/ui';

interface TaxSetting {
  id?: string;
  name: string;
  type: 'percentage' | 'fixed';
  rate: number | null;
  fixedAmount: number | null;
  applyToEntireOrder: boolean;
}

interface FinancialSettings {
  currencyCode: string;
  currencySymbol: string;
  taxes: TaxSetting[];
  tipsEnabled: boolean;
  tipPresets: number[];
  allowCustomTip: boolean;
  platformFeeEnabled: boolean;
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
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FinancialSettings>({
    currencyCode: 'USD',
    currencySymbol: '$',
    taxes: [],
    tipsEnabled: true,
    tipPresets: [15, 18, 20],
    allowCustomTip: true,
    platformFeeEnabled: false,
    platformFeeThreshold: 50,
    platformFeeBelowThreshold: 5,
    platformFeeAboveThreshold: 2.5,
    paymentProvider: 'stripe',
    stripeConnectedAccountId: null,
    testMode: true,
  });

  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  const [showTaxForm, setShowTaxForm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/financial?restaurantId=${restaurantId}`);
      if (response.ok) {
        const settings = await response.json();
        setData({
          currencyCode: settings.currencyCode || 'USD',
          currencySymbol: settings.currencySymbol || '$',
          taxes: settings.taxes || [],
          tipsEnabled: settings.tipsEnabled ?? true,
          tipPresets: settings.tipPresets || [15, 18, 20],
          allowCustomTip: settings.allowCustomTip ?? true,
          platformFeeEnabled: settings.globalFee?.enabled ?? false,
          platformFeeThreshold: settings.globalFee?.threshold ?? 50,
          platformFeeBelowThreshold: settings.globalFee?.belowPercent ?? 5,
          platformFeeAboveThreshold: settings.globalFee?.aboveFlat ?? 2.5,
          paymentProvider: settings.paymentProvider || 'stripe',
          stripeConnectedAccountId: settings.stripeConnectedAccountId,
          testMode: settings.testMode ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/financial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          ...data,
          globalFee: {
            enabled: data.platformFeeEnabled,
            threshold: data.platformFeeThreshold,
            belowPercent: data.platformFeeBelowThreshold,
            aboveFlat: data.platformFeeAboveThreshold,
          },
        }),
      });

      if (response.ok) {
        alert('Financial settings saved successfully!');
        await fetchSettings();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
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
    setShowTaxForm(true);
  };

  const handleSaveTax = () => {
    if (!editingTax) return;

    if (editingTax.id) {
      // Update existing tax
      setData({
        ...data,
        taxes: data.taxes.map((tax) =>
          tax.id === editingTax.id ? editingTax : tax
        ),
      });
    } else {
      // Add new tax
      setData({
        ...data,
        taxes: [...data.taxes, { ...editingTax, id: Date.now().toString() }],
      });
    }

    setEditingTax(null);
    setShowTaxForm(false);
  };

  const handleDeleteTax = (id: string) => {
    setData({
      ...data,
      taxes: data.taxes.filter((tax) => tax.id !== id),
    });
  };

  const handleConnectStripe = () => {
    // Redirect to Stripe Connect OAuth
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/stripe/oauth/callback`;
    const state = restaurantId;

    window.location.href = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}&redirect_uri=${redirectUri}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-traces-gold-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Currency */}
      <section>
        <h2 className="text-xl font-light tracking-wider text-traces-gold-100 mb-4 border-b border-traces-gold-900/30 pb-2">
          {t('currency')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-light text-traces-dark-300 mb-2">
              {t('currencyCode')}
            </label>
            <Input
              value={data.currencyCode}
              onChange={(e) => setData({ ...data, currencyCode: e.target.value })}
              placeholder="USD"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-traces-dark-300 mb-2">
              {t('currencySymbol')}
            </label>
            <Input
              value={data.currencySymbol}
              onChange={(e) => setData({ ...data, currencySymbol: e.target.value })}
              placeholder="$"
            />
          </div>
        </div>
      </section>

      {/* Taxes */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-traces-gold-900/30 pb-2">
          <h2 className="text-xl font-light tracking-wider text-traces-gold-100">
            {t('taxes')}
          </h2>
          <Button
            onClick={handleAddTax}
            className="bg-traces-gold-600 hover:bg-traces-gold-700 text-black text-sm px-4 py-2"
          >
            + {t('addTax')}
          </Button>
        </div>

        {/* Tax List */}
        <div className="space-y-2 mb-4">
          {data.taxes.map((tax) => (
            <div
              key={tax.id}
              className="bg-black/20 border border-traces-gold-900/30 rounded-sm p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-traces-gold-100 font-light">{tax.name}</div>
                <div className="text-sm text-traces-dark-300">
                  {tax.type === 'percentage'
                    ? `${tax.rate}%`
                    : `$${tax.fixedAmount?.toFixed(2)}`}
                  {' • '}
                  {tax.applyToEntireOrder ? t('entireOrder') : t('perItem')}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTax(tax);
                    setShowTaxForm(true);
                  }}
                  className="text-traces-gold-600 hover:text-traces-gold-500 text-sm"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDeleteTax(tax.id!)}
                  className="text-traces-burgundy-600 hover:text-traces-burgundy-500 text-sm"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}

          {data.taxes.length === 0 && (
            <div className="text-center py-8 text-traces-dark-300">
              No taxes configured. Click "Add Tax" to create one.
            </div>
          )}
        </div>

        {/* Tax Form */}
        {showTaxForm && editingTax && (
          <div className="bg-black/40 border border-traces-gold-600 rounded-sm p-4 space-y-4">
            <div>
              <label className="block text-sm font-light text-traces-dark-300 mb-2">
                {t('taxName')}
              </label>
              <Input
                value={editingTax.name}
                onChange={(e) =>
                  setEditingTax({ ...editingTax, name: e.target.value })
                }
                placeholder="Sales Tax"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-traces-dark-300 mb-2">
                {t('taxType')}
              </label>
              <select
                value={editingTax.type}
                onChange={(e) =>
                  setEditingTax({
                    ...editingTax,
                    type: e.target.value as 'percentage' | 'fixed',
                  })
                }
                className="w-full bg-black/20 border border-traces-gold-900/30 rounded-sm px-4 py-2.5 text-traces-gold-100 focus:outline-none focus:border-traces-gold-600"
              >
                <option value="percentage">{t('percentage')}</option>
                <option value="fixed">{t('fixed')}</option>
              </select>
            </div>

            {editingTax.type === 'percentage' ? (
              <div>
                <label className="block text-sm font-light text-traces-dark-300 mb-2">
                  {t('rate')} (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTax.rate || 0}
                  onChange={(e) =>
                    setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) })
                  }
                  placeholder="8.5"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-light text-traces-dark-300 mb-2">
                  {t('amount')} ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTax.fixedAmount || 0}
                  onChange={(e) =>
                    setEditingTax({
                      ...editingTax,
                      fixedAmount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="2.50"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-light text-traces-dark-300 mb-2">
                {t('applyTo')}
              </label>
              <select
                value={editingTax.applyToEntireOrder ? 'entire' : 'perItem'}
                onChange={(e) =>
                  setEditingTax({
                    ...editingTax,
                    applyToEntireOrder: e.target.value === 'entire',
                  })
                }
                className="w-full bg-black/20 border border-traces-gold-900/30 rounded-sm px-4 py-2.5 text-traces-gold-100 focus:outline-none focus:border-traces-gold-600"
              >
                <option value="entire">{t('entireOrder')}</option>
                <option value="perItem">{t('perItem')}</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setEditingTax(null);
                  setShowTaxForm(false);
                }}
                className="bg-traces-dark-700 hover:bg-traces-dark-600 text-traces-gold-100"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSaveTax}
                className="bg-traces-gold-600 hover:bg-traces-gold-700 text-black"
              >
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Tips */}
      <section>
        <h2 className="text-xl font-light tracking-wider text-traces-gold-100 mb-4 border-b border-traces-gold-900/30 pb-2">
          {t('tips')}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-traces-gold-100">{t('enableTips')}</span>
            <Toggle
              checked={data.tipsEnabled}
              onChange={(checked) => setData({ ...data, tipsEnabled: checked })}
            />
          </div>

          {data.tipsEnabled && (
            <>
              <div>
                <label className="block text-sm font-light text-traces-dark-300 mb-2">
                  {t('presetPercentages')} (comma-separated)
                </label>
                <Input
                  value={data.tipPresets.join(', ')}
                  onChange={(e) =>
                    setData({
                      ...data,
                      tipPresets: e.target.value
                        .split(',')
                        .map((v) => parseInt(v.trim()))
                        .filter((v) => !isNaN(v)),
                    })
                  }
                  placeholder="15, 18, 20"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-traces-gold-100">{t('customTip')}</span>
                <Toggle
                  checked={data.allowCustomTip}
                  onChange={(checked) => setData({ ...data, allowCustomTip: checked })}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Platform Fee */}
      <section>
        <h2 className="text-xl font-light tracking-wider text-traces-gold-100 mb-4 border-b border-traces-gold-900/30 pb-2">
          {t('platformFee')}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-traces-gold-100">{t('enablePlatformFee')}</span>
            <Toggle
              checked={data.platformFeeEnabled}
              onChange={(checked) =>
                setData({ ...data, platformFeeEnabled: checked })
              }
            />
          </div>

          {data.platformFeeEnabled && (
            <>
              <div>
                <label className="block text-sm font-light text-traces-dark-300 mb-2">
                  {t('threshold')} ($)
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
                  placeholder="50.00"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-traces-dark-300 mb-2">
                  {t('belowThreshold')}
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
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-traces-dark-300 mb-2">
                  {t('aboveThreshold')} ($)
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
                  placeholder="2.50"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Payment Provider */}
      <section>
        <h2 className="text-xl font-light tracking-wider text-traces-gold-100 mb-4 border-b border-traces-gold-900/30 pb-2">
          {t('payment')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-light text-traces-dark-300 mb-2">
              {t('paymentProvider')}
            </label>
            <select
              value={data.paymentProvider}
              onChange={(e) =>
                setData({ ...data, paymentProvider: e.target.value })
              }
              className="w-full bg-black/20 border border-traces-gold-900/30 rounded-sm px-4 py-2.5 text-traces-gold-100 focus:outline-none focus:border-traces-gold-600"
            >
              <option value="stripe">{t('stripe')}</option>
              <option value="mercadopago">{t('mercadopago')}</option>
            </select>
          </div>

          {data.paymentProvider === 'stripe' && (
            <div>
              {data.stripeConnectedAccountId ? (
                <div className="bg-green-900/20 border border-green-600/30 rounded-sm p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{t('stripeConnected')}</span>
                  </div>
                  <div className="text-sm text-traces-dark-300 mt-2">
                    Account ID: {data.stripeConnectedAccountId}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnectStripe}
                  className="bg-[#635bff] hover:bg-[#5851ea] text-white w-full"
                >
                  {t('connectStripe')}
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-traces-gold-100">{t('testMode')}</span>
            <Toggle
              checked={data.testMode}
              onChange={(checked) => setData({ ...data, testMode: checked })}
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-traces-gold-900/30">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-traces-burgundy-600 hover:bg-traces-burgundy-700 text-white px-6"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
