'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Toggle } from '@/components/ui';

interface DeliveryPricingTier {
  id?: string;
  name: string;
  distanceCovered: number;
  baseFee: number;
  additionalFeePerUnit: number;
  isDefault: boolean;
}

interface DeliverySettings {
  provider: string;
  maxDeliveryRadius: number;
  distanceUnit: 'km' | 'miles';
  pricingTiers: DeliveryPricingTier[];
}

export default function DeliverySettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.delivery');
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<DeliverySettings>({
    provider: 'shipday',
    maxDeliveryRadius: 10,
    distanceUnit: 'miles',
    pricingTiers: [],
  });

  const [editingTier, setEditingTier] = useState<DeliveryPricingTier | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/delivery?restaurantId=${restaurantId}`);
      if (response.ok) {
        const settings = await response.json();
        setData({
          provider: settings.provider || 'shipday',
          maxDeliveryRadius: settings.maxDeliveryRadius || 10,
          distanceUnit: settings.distanceUnit || 'miles',
          pricingTiers: settings.pricingTiers || [],
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
      const response = await fetch(`/api/settings/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          ...data,
        }),
      });

      if (response.ok) {
        alert('Delivery settings saved successfully!');
        await fetchSettings();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTier = () => {
    setEditingTier({
      name: 'Default',
      distanceCovered: 5,
      baseFee: 5,
      additionalFeePerUnit: 1,
      isDefault: data.pricingTiers.length === 0,
    });
    setShowTierForm(true);
  };

  const handleSaveTier = () => {
    if (!editingTier) return;

    // Ensure only one default tier
    let tiers = data.pricingTiers;
    if (editingTier.isDefault) {
      tiers = tiers.map((tier) => ({ ...tier, isDefault: false }));
    }

    if (editingTier.id) {
      // Update existing tier
      setData({
        ...data,
        pricingTiers: tiers.map((tier) =>
          tier.id === editingTier.id ? editingTier : tier
        ),
      });
    } else {
      // Add new tier
      setData({
        ...data,
        pricingTiers: [...tiers, { ...editingTier, id: Date.now().toString() }],
      });
    }

    setEditingTier(null);
    setShowTierForm(false);
  };

  const handleDeleteTier = (id: string) => {
    setData({
      ...data,
      pricingTiers: data.pricingTiers.filter((tier) => tier.id !== id),
    });
  };

  const calculateExampleFee = (tier: DeliveryPricingTier, distance: number) => {
    if (distance <= tier.distanceCovered) {
      return tier.baseFee;
    }
    const excess = distance - tier.distanceCovered;
    return tier.baseFee + excess * tier.additionalFeePerUnit;
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
      {/* Provider Settings */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-3">
          {t('provider')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('deliveryProvider')}
            </label>
            <select
              value={data.provider}
              onChange={(e) => setData({ ...data, provider: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-gray-900 focus:outline-none focus:border-brand-red"
            >
              <option value="shipday">{t('shipday')}</option>
              <option value="internal">{t('internal')}</option>
              <option value="doordash">{t('doordash')}</option>
              <option value="ubereats">{t('ubereats')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Delivery Zones */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-3">
          {t('zones')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('maxDeliveryRadius')}
            </label>
            <Input
              type="number"
              step="0.1"
              value={data.maxDeliveryRadius}
              onChange={(e) =>
                setData({ ...data, maxDeliveryRadius: parseFloat(e.target.value) })
              }
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('distanceUnit')}
            </label>
            <select
              value={data.distanceUnit}
              onChange={(e) =>
                setData({ ...data, distanceUnit: e.target.value as 'km' | 'miles' })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-gray-900 focus:outline-none focus:border-brand-red"
            >
              <option value="miles">{t('miles')}</option>
              <option value="kilometers">{t('kilometers')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
          <h3 className="text-base font-semibold text-gray-900">
            {t('pricingTiers')}
          </h3>
          <Button
            onClick={handleAddTier}
            className="bg-brand-red hover:bg-brand-red/90 text-white text-sm px-4 py-2"
          >
            + {t('addTier')}
          </Button>
        </div>

        {/* Pricing Tier List */}
        <div className="space-y-3 mb-4">
          {data.pricingTiers.map((tier) => {
            const exampleDistance = tier.distanceCovered + 5;
            const exampleCost = calculateExampleFee(tier, exampleDistance);

            return (
              <div
                key={tier.id}
                className="bg-gray-50 border border-gray-200 rounded-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-light text-lg">
                        {tier.name}
                      </span>
                      {tier.isDefault && (
                        <span className="bg-brand-red text-black text-xs px-2 py-0.5 rounded-sm">
                          {t('default')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t('tierDescription', {
                        distance: tier.distanceCovered,
                        unit: data.distanceUnit,
                        baseFee: tier.baseFee.toFixed(2),
                        additionalFee: tier.additionalFeePerUnit.toFixed(2),
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTier(tier);
                        setShowTierForm(true);
                      }}
                      className="text-brand-red hover:text-brand-red/90 text-sm"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteTier(tier.id!)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>

                {/* Example Calculation */}
                <div className="bg-gray-100 rounded-sm p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">
                    {t('exampleCalculation', {
                      distance: exampleDistance,
                      unit: data.distanceUnit,
                      total: exampleCost.toFixed(2),
                    })}
                  </div>
                  <div className="text-xs text-gray-900">
                    ${tier.baseFee.toFixed(2)} (base) + $
                    {((exampleDistance - tier.distanceCovered) * tier.additionalFeePerUnit).toFixed(2)}{' '}
                    ({exampleDistance - tier.distanceCovered} × $
                    {tier.additionalFeePerUnit.toFixed(2)}) = ${exampleCost.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}

          {data.pricingTiers.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No pricing tiers configured. Click "Add Pricing Tier" to create one.
            </div>
          )}
        </div>

        {/* Tier Form */}
        {showTierForm && editingTier && (
          <div className="bg-gray-100 border border-brand-red rounded-sm p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tierName')}
              </label>
              <Input
                value={editingTier.name}
                onChange={(e) =>
                  setEditingTier({ ...editingTier, name: e.target.value })
                }
                placeholder="Default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('distanceCovered')} ({data.distanceUnit})
              </label>
              <Input
                type="number"
                step="0.1"
                value={editingTier.distanceCovered}
                onChange={(e) =>
                  setEditingTier({
                    ...editingTier,
                    distanceCovered: parseFloat(e.target.value),
                  })
                }
                placeholder="5"
              />
              <div className="text-xs text-gray-600 mt-1">
                Base coverage area radius
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('baseFee')} ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={editingTier.baseFee}
                onChange={(e) =>
                  setEditingTier({
                    ...editingTier,
                    baseFee: parseFloat(e.target.value),
                  })
                }
                placeholder="5.00"
              />
              <div className="text-xs text-gray-600 mt-1">
                Fee for deliveries within coverage area
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('additionalFee')} ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={editingTier.additionalFeePerUnit}
                onChange={(e) =>
                  setEditingTier({
                    ...editingTier,
                    additionalFeePerUnit: parseFloat(e.target.value),
                  })
                }
                placeholder="1.00"
              />
              <div className="text-xs text-gray-600 mt-1">
                Additional fee per {data.distanceUnit === 'miles' ? 'mile' : 'kilometer'}{' '}
                beyond coverage area
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-sm border border-gray-200">
              <span className="text-gray-900 text-sm">{t('default')}</span>
              <Toggle
                checked={editingTier.isDefault}
                onChange={(checked) =>
                  setEditingTier({ ...editingTier, isDefault: checked })
                }
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setEditingTier(null);
                  setShowTierForm(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSaveTier}
                className="bg-brand-red hover:bg-brand-red/90 text-white"
              >
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
