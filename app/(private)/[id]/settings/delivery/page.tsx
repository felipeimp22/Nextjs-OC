'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { getDeliverySettings, updateDeliverySettings } from '@/lib/serverActions/settings.actions';

export default function DeliverySettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.delivery');
  const { showToast } = useToast();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    maxDeliveryRadius: 10,
    distanceUnit: 'miles' as 'km' | 'miles',
    pricingTier: {
      name: 'Default',
      distanceCovered: 10,
      baseFee: 10,
      additionalFeePerUnit: 2,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const result = await getDeliverySettings(restaurantId);
      
      if (result.success && result.data && result.data.pricingTiers?.[0]) {
        const settings = result.data;
        const tier = settings.pricingTiers[0];
        setData({
          maxDeliveryRadius: settings.maxDeliveryRadius || 10,
          distanceUnit: settings.distanceUnit || 'miles',
          pricingTier: {
            name: tier.name || 'Default',
            distanceCovered: tier.distanceCovered || 10,
            baseFee: tier.baseFee || 10,
            additionalFeePerUnit: tier.additionalFeePerUnit || 2,
          },
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateDeliverySettings(restaurantId, {
        provider: 'shipday',
        maxDeliveryRadius: data.maxDeliveryRadius,
        distanceUnit: data.distanceUnit,
        pricingTiers: [
          {
            ...data.pricingTier,
            isDefault: true,
          },
        ],
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
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const calculateExample = () => {
    const distance = data.pricingTier.distanceCovered + 5;
    const excess = distance - data.pricingTier.distanceCovered;
    return data.pricingTier.baseFee + (excess * data.pricingTier.additionalFeePerUnit);
  };

  return (
    <div className="p-6 space-y-8">
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Delivery Provider
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900">Shipday</div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Professional delivery service integration
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Delivery Zone
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Delivery Radius
            </label>
            <Input
              type="number"
              step="0.1"
              value={data.maxDeliveryRadius}
              onChange={(e) =>
                setData({ ...data, maxDeliveryRadius: parseFloat(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance Unit
            </label>
            <select
              value={data.distanceUnit}
              onChange={(e) =>
                setData({ ...data, distanceUnit: e.target.value as 'km' | 'miles' })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <option value="miles">Miles</option>
              <option value="kilometers">Kilometers</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Delivery Pricing
        </h3>
        
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Distance Covered ({data.distanceUnit})
              </label>
              <Input
                type="number"
                step="0.1"
                value={data.pricingTier.distanceCovered}
                onChange={(e) =>
                  setData({
                    ...data,
                    pricingTier: {
                      ...data.pricingTier,
                      distanceCovered: parseFloat(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Area covered by base fee
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fee ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={data.pricingTier.baseFee}
                onChange={(e) =>
                  setData({
                    ...data,
                    pricingTier: {
                      ...data.pricingTier,
                      baseFee: parseFloat(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Fee for deliveries within base distance
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Fee per {data.distanceUnit === 'miles' ? 'Mile' : 'Kilometer'} ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={data.pricingTier.additionalFeePerUnit}
              onChange={(e) =>
                setData({
                  ...data,
                  pricingTier: {
                    ...data.pricingTier,
                    additionalFeePerUnit: parseFloat(e.target.value),
                  },
                })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Charged for each additional {data.distanceUnit === 'miles' ? 'mile' : 'kilometer'} beyond base distance
            </p>
          </div>

          <div className="bg-white border border-gray-300 rounded-md p-4 mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Example Calculation:</div>
            <div className="text-sm text-gray-600">
              A delivery at {data.pricingTier.distanceCovered + 5} {data.distanceUnit} would cost: 
              <span className="font-semibold text-gray-900 ml-1">
                ${calculateExample().toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ${data.pricingTier.baseFee} (base) + $
              {(5 * data.pricingTier.additionalFeePerUnit).toFixed(2)} (5 × ${data.pricingTier.additionalFeePerUnit})
            </div>
          </div>
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
