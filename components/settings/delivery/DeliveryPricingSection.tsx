'use client';

import { FormSection, FormField, InfoCard } from '@/components/shared';
import { Input } from '@/components/ui';

interface PricingTier {
  name: string;
  distanceCovered: number;
  baseFee: number;
  additionalFeePerUnit: number;
}

interface DeliveryPricingSectionProps {
  pricingTier: PricingTier;
  maximumRadius: number;
  distanceUnit: string;
  onPricingChange: (tier: PricingTier) => void;
  t: (key: string, values?: Record<string, any>) => string;
}

export default function DeliveryPricingSection({
  pricingTier,
  maximumRadius,
  distanceUnit,
  onPricingChange,
  t,
}: DeliveryPricingSectionProps) {
  const unitLabel = distanceUnit === 'miles' ? t('miles') : t('kilometers');
  const perUnitLabel = distanceUnit === 'miles' ? t('additionalFeePerMile') : t('additionalFeePerKm');

  return (
    <FormSection
      title={t('pricing')}
      description={t('pricingDescription')}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={`${t('baseDistanceCovered')} (${unitLabel})`}
            required
            description={t('baseDistanceDescription')}
          >
            <Input
              type="number"
              step="0.1"
              value={pricingTier.distanceCovered}
              onChange={(e) =>
                onPricingChange({
                  ...pricingTier,
                  distanceCovered: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="10"
            />
          </FormField>

          <FormField
            label={t('baseFee')}
            required
            description={t('baseFeeDescription')}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                value={pricingTier.baseFee}
                onChange={(e) =>
                  onPricingChange({
                    ...pricingTier,
                    baseFee: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-7"
                placeholder="10.00"
              />
            </div>
          </FormField>
        </div>

        <FormField
          label={perUnitLabel}
          required
          description={t('additionalFeeDescription', { unit: unitLabel.toLowerCase() })}
        >
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              value={pricingTier.additionalFeePerUnit}
              onChange={(e) =>
                onPricingChange({
                  ...pricingTier,
                  additionalFeePerUnit: parseFloat(e.target.value) || 0,
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
            <div className="text-sm font-medium text-gray-700 mb-2">{t('pricingExamples')}</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t('deliveryAt', { distance: String(pricingTier.distanceCovered), unit: unitLabel })}</span>
                <span className="font-semibold text-gray-900">
                  ${pricingTier.baseFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('deliveryAt', { distance: String(pricingTier.distanceCovered + 5), unit: unitLabel })}</span>
                <span className="font-semibold text-gray-900">
                  ${(pricingTier.baseFee + (5 * pricingTier.additionalFeePerUnit)).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
                {t('calculation')}: ${pricingTier.baseFee.toFixed(2)} (base) +
                ${(5 * pricingTier.additionalFeePerUnit).toFixed(2)}
                (5 {unitLabel} × ${pricingTier.additionalFeePerUnit.toFixed(2)})
              </div>
            </div>
          </div>

          <InfoCard type="info">
            <p className="mb-2">
              <strong>{t('howItWorks')}:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>{t('withinDistance', { distance: String(pricingTier.distanceCovered), unit: unitLabel, baseFee: pricingTier.baseFee.toFixed(2) })}</li>
              <li>{t('beyondDistance', { distance: String(pricingTier.distanceCovered), unit: unitLabel, additionalFee: pricingTier.additionalFeePerUnit.toFixed(2) })}</li>
              <li>{t('maxRange', { range: String(maximumRadius), unit: unitLabel })}</li>
            </ul>
          </InfoCard>
        </div>
      </div>
    </FormSection>
  );
}
