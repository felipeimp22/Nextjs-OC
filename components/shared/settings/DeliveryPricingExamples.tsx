'use client';

import { InfoCard } from '@/components/shared';

interface DeliveryPricingExamplesProps {
  distanceCovered: number;
  baseFee: number;
  additionalFeePerUnit: number;
  maximumRadius: number;
  distanceUnit: string;
}

export default function DeliveryPricingExamples({
  distanceCovered,
  baseFee,
  additionalFeePerUnit,
  maximumRadius,
  distanceUnit,
}: DeliveryPricingExamplesProps) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Pricing Examples:</div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Delivery at {distanceCovered} {distanceUnit} or less:</span>
            <span className="font-semibold text-gray-900">
              ${baseFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Delivery at {distanceCovered + 5} {distanceUnit}:</span>
            <span className="font-semibold text-gray-900">
              ${(baseFee + (5 * additionalFeePerUnit)).toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
            Calculation: ${baseFee.toFixed(2)} (base) +
            ${(5 * additionalFeePerUnit).toFixed(2)}
            (5 {distanceUnit} × ${additionalFeePerUnit.toFixed(2)})
          </div>
        </div>
      </div>

      <InfoCard type="info">
        <p className="mb-2">
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Deliveries within {distanceCovered} {distanceUnit} = ${baseFee.toFixed(2)} flat fee</li>
          <li>Beyond {distanceCovered} {distanceUnit} = Base fee + ${additionalFeePerUnit.toFixed(2)} per {distanceUnit === 'miles' ? 'mile' : 'km'}</li>
          <li>Maximum delivery range: {maximumRadius} {distanceUnit} (orders beyond this will be rejected)</li>
        </ul>
      </InfoCard>
    </div>
  );
}
