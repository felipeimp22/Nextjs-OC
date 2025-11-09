'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast, Toggle } from '@/components/ui';
import { FormSection, FormField, InfoCard } from '@/components/shared';
import { DeliveryProviderSection, DeliveryPricingSection } from '@/components/settings/delivery';
import { getDeliverySettings, updateDeliverySettings } from '@/lib/serverActions/settings.actions';

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
          distanceUnit: settings.distanceUnit as "miles"| "km" || 'miles',
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
      <DeliveryProviderSection
        provider={data.provider}
        onProviderChange={(provider) => setData({ ...data, provider })}
        t={t}
      />

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
        <DeliveryPricingSection
          pricingTier={data.pricingTier}
          maximumRadius={data.maximumRadius}
          distanceUnit={data.distanceUnit}
          onPricingChange={(tier) => setData({ ...data, pricingTier: tier })}
          t={t}
        />
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
