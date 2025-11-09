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
}

export default function DeliveryPricingSection({
  pricingTier,
  maximumRadius,
  distanceUnit,
  onPricingChange,
}: DeliveryPricingSectionProps) {
  return (
    <FormSection
      title="Delivery Pricing"
      description="Configure distance-based pricing for local deliveries"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={`Base Distance Covered (${distanceUnit})`}
            required
            description="Distance included in base fee"
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
          label={`Additional Fee per ${distanceUnit === 'miles' ? 'Mile' : 'Kilometer'}`}
          required
          description={`Charged for each ${distanceUnit === 'miles' ? 'mile' : 'kilometer'} beyond base distance`}
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
            <div className="text-sm font-medium text-gray-700 mb-2">Pricing Examples:</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Delivery at {pricingTier.distanceCovered} {distanceUnit} or less:</span>
                <span className="font-semibold text-gray-900">
                  ${pricingTier.baseFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery at {pricingTier.distanceCovered + 5} {distanceUnit}:</span>
                <span className="font-semibold text-gray-900">
                  ${(pricingTier.baseFee + (5 * pricingTier.additionalFeePerUnit)).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
                Calculation: ${pricingTier.baseFee.toFixed(2)} (base) +
                ${(5 * pricingTier.additionalFeePerUnit).toFixed(2)}
                (5 {distanceUnit} × ${pricingTier.additionalFeePerUnit.toFixed(2)})
              </div>
            </div>
          </div>

          <InfoCard type="info">
            <p className="mb-2">
              <strong>How it works:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Deliveries within {pricingTier.distanceCovered} {distanceUnit} = ${pricingTier.baseFee.toFixed(2)} flat fee</li>
              <li>Beyond {pricingTier.distanceCovered} {distanceUnit} = Base fee + ${pricingTier.additionalFeePerUnit.toFixed(2)} per {distanceUnit === 'miles' ? 'mile' : 'km'}</li>
              <li>Maximum delivery range: {maximumRadius} {distanceUnit} (orders beyond this will be rejected)</li>
            </ul>
          </InfoCard>
        </div>
      </div>
    </FormSection>
  );
}
