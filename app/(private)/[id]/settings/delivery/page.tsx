'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast, Toggle } from '@/components/ui';
import { FormSection, FormField, InfoCard } from '@/components/shared';
import { getDeliverySettings, updateDeliverySettings } from '@/lib/serverActions/settings.actions';
import { Truck, Package } from 'lucide-react';

type DeliveryProvider = 'shipday' | 'local';

interface DeliveryData {
  enabled: boolean;
  provider: DeliveryProvider;
  distanceUnit: 'miles' | 'km';
  maximumRadius: number;
  // Pricing tier for distance-based pricing
  pricingTier: {
    name: string;
    distanceCovered: number;
    baseFee: number;
    additionalFeePerUnit: number;
  };
}

export default function DeliverySettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.delivery');
  const { showToast } = useToast();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<DeliveryData>({
    enabled: true,
    provider: 'local',
    distanceUnit: 'miles',
    maximumRadius: 10,
    pricingTier: {
      name: 'Default',
      distanceCovered: 10,
      baseFee: 5.00,
      additionalFeePerUnit: 1.00,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const result = await getDeliverySettings(restaurantId);

      if (result.success && result.data) {
        const settings = result.data;
        const tier = settings.pricingTiers?.[0];

        setData({
          enabled: settings.enabled ?? true,
          provider: (settings.driverProvider === 'shipday' ? 'shipday' : 'local') as DeliveryProvider,
          distanceUnit: settings.distanceUnit || 'miles',
          maximumRadius: settings.maximumRadius || 10,
          pricingTier: {
            name: tier?.name || 'Default',
            distanceCovered: tier?.distanceCovered || 10,
            baseFee: tier?.baseFee || 5.00,
            additionalFeePerUnit: tier?.additionalFeePerUnit || 1.00,
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
    // Validation for local delivery
    if (data.provider === 'local') {
      if (!data.pricingTier.distanceCovered || data.pricingTier.distanceCovered <= 0) {
        showToast('error', 'Please enter a valid base distance');
        return;
      }
      if (!data.pricingTier.baseFee || data.pricingTier.baseFee <= 0) {
        showToast('error', 'Please enter a valid base fee');
        return;
      }
      if (data.pricingTier.additionalFeePerUnit < 0) {
        showToast('error', 'Additional fee per unit cannot be negative');
        return;
      }
    }

    setSaving(true);
    try {
      const result = await updateDeliverySettings(restaurantId, {
        enabled: data.enabled,
        driverProvider: data.provider,
        distanceUnit: data.distanceUnit,
        maximumRadius: data.maximumRadius,
        pricingTiers: [
          {
            name: 'Default',
            distanceCovered: data.pricingTier.distanceCovered,
            baseFee: data.pricingTier.baseFee,
            additionalFeePerUnit: data.pricingTier.additionalFeePerUnit,
            isDefault: true,
          },
        ],
      });

      if (!result.success) {
        showToast('error', result.error || 'Failed to save settings');
        return;
      }

      showToast('success', 'Delivery settings saved successfully!');
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Delivery Status */}
      <FormSection title="Delivery Service">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Enable Delivery</p>
            <p className="text-sm text-gray-600 mt-1">Allow customers to choose delivery for their orders</p>
          </div>
          <Toggle
            id="delivery-enabled"
            checked={data.enabled}
            onChange={(checked) => setData({ ...data, enabled: checked })}
            size="lg"
          />
        </div>
      </FormSection>

      {/* Delivery Provider Selection */}
      <FormSection title="Delivery Provider" description="Choose how you want to handle deliveries">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Delivery Option */}
          <button
            type="button"
            onClick={() => setData({ ...data, provider: 'local' })}
            className={`relative p-6 rounded-lg border-2 transition-all ${
              data.provider === 'local'
                ? 'border-brand-red bg-red-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-full ${data.provider === 'local' ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Local Delivery</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Manage deliveries with your own drivers or system
                </p>
              </div>
            </div>
            {data.provider === 'local' && (
              <div className="absolute top-3 right-3">
                <div className="bg-brand-red text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>

          {/* Shipday Option */}
          <button
            type="button"
            onClick={() => setData({ ...data, provider: 'shipday' })}
            className={`relative p-6 rounded-lg border-2 transition-all ${
              data.provider === 'shipday'
                ? 'border-brand-red bg-red-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-full ${data.provider === 'shipday' ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Shipday</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Professional third-party delivery service integration
                </p>
              </div>
            </div>
            {data.provider === 'shipday' && (
              <div className="absolute top-3 right-3">
                <div className="bg-brand-red text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Provider-specific information */}
        {data.provider === 'shipday' && (
          <InfoCard type="success" title="Shipday Integration" className="mt-6">
            <p>
              Shipday delivery is managed by our platform. No additional configuration needed -
              all deliveries will be automatically dispatched through our Shipday integration.
            </p>
          </InfoCard>
        )}

        {data.provider === 'local' && (
          <InfoCard type="success" className="mt-6">
            With local delivery, you'll manage delivery assignments and tracking through your own system.
          </InfoCard>
        )}
      </FormSection>

      {/* Delivery Zone Configuration */}
      <FormSection title="Delivery Zone" description="Set your delivery coverage area">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Maximum Delivery Radius" required>
            <Input
              type="number"
              step="0.1"
              value={data.maximumRadius}
              onChange={(e) =>
                setData({ ...data, maximumRadius: parseFloat(e.target.value) || 0 })
              }
              placeholder="10"
            />
          </FormField>

          <FormField label="Distance Unit">
            <select
              value={data.distanceUnit}
              onChange={(e) =>
                setData({ ...data, distanceUnit: e.target.value as 'km' | 'miles' })
              }
              className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
            >
              <option value="miles">Miles</option>
              <option value="km">Kilometers</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Delivery Fee Configuration (Local only) */}
      {data.provider === 'local' && (
        <FormSection
          title="Delivery Pricing"
          description="Configure distance-based pricing for local deliveries"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label={`Base Distance Covered (${data.distanceUnit})`}
                required
                description="Distance included in base fee"
              >
                <Input
                  type="number"
                  step="0.1"
                  value={data.pricingTier.distanceCovered}
                  onChange={(e) =>
                    setData({
                      ...data,
                      pricingTier: {
                        ...data.pricingTier,
                        distanceCovered: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="10"
                />
              </FormField>

              <FormField
                label="Base Fee"
                required
                description="Fee for base distance"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.pricingTier.baseFee}
                    onChange={(e) =>
                      setData({
                        ...data,
                        pricingTier: {
                          ...data.pricingTier,
                          baseFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="pl-7"
                    placeholder="10.00"
                  />
                </div>
              </FormField>
            </div>

            <FormField
              label={`Additional Fee per ${data.distanceUnit === 'miles' ? 'Mile' : 'Kilometer'}`}
              required
              description={`Charged for each ${data.distanceUnit === 'miles' ? 'mile' : 'kilometer'} beyond base distance`}
            >
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={data.pricingTier.additionalFeePerUnit}
                  onChange={(e) =>
                    setData({
                      ...data,
                      pricingTier: {
                        ...data.pricingTier,
                        additionalFeePerUnit: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="pl-7"
                  placeholder="1.00"
                />
              </div>
            </FormField>

            {/* Pricing Examples */}
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Pricing Examples:</div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Delivery at {data.pricingTier.distanceCovered} {data.distanceUnit} or less:</span>
                    <span className="font-semibold text-gray-900">
                      ${data.pricingTier.baseFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery at {data.pricingTier.distanceCovered + 5} {data.distanceUnit}:</span>
                    <span className="font-semibold text-gray-900">
                      ${(data.pricingTier.baseFee + (5 * data.pricingTier.additionalFeePerUnit)).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
                    Calculation: ${data.pricingTier.baseFee.toFixed(2)} (base) +
                    ${(5 * data.pricingTier.additionalFeePerUnit).toFixed(2)}
                    (5 {data.distanceUnit} × ${data.pricingTier.additionalFeePerUnit.toFixed(2)})
                  </div>
                </div>
              </div>

              <InfoCard type="info">
                <p className="mb-2">
                  <strong>How it works:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Deliveries within {data.pricingTier.distanceCovered} {data.distanceUnit} = ${data.pricingTier.baseFee.toFixed(2)} flat fee</li>
                  <li>Beyond {data.pricingTier.distanceCovered} {data.distanceUnit} = Base fee + ${data.pricingTier.additionalFeePerUnit.toFixed(2)} per {data.distanceUnit === 'miles' ? 'mile' : 'km'}</li>
                  <li>Maximum delivery range: {data.maximumRadius} {data.distanceUnit} (orders beyond this will be rejected)</li>
                </ul>
              </InfoCard>
            </div>
          </div>
        </FormSection>
      )}

      {/* Advanced Pricing (for future use - display only for shipday) */}
      {data.provider === 'shipday' && (
        <FormSection title="Pricing Information">
          <InfoCard type="info">
            Delivery pricing is managed automatically by Shipday based on distance and their pricing structure.
            Check your Shipday dashboard for detailed pricing information.
          </InfoCard>
        </FormSection>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving || !data.enabled}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-8"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
