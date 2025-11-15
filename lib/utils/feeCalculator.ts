// lib/utils/feeCalculator.ts

/**
 * Centralized Fee Calculation Service
 *
 * This service handles platform/global fee calculations with
 * threshold-based logic for orders.
 */

export interface GlobalFeeSettings {
  enabled: boolean;
  threshold: number;
  belowPercent: number;
  aboveFlat: number;
}

export interface FeeCalculationResult {
  platformFee: number;
  appliedRule: 'percentage' | 'flat' | 'none';
  percentageUsed?: number;
  flatAmountUsed?: number;
}

/**
 * Calculate platform/global fee based on threshold
 *
 * Logic:
 * - If subtotal < threshold: Apply percentage fee
 * - If subtotal >= threshold: Apply flat fee
 * - If disabled: Return 0
 *
 * @param subtotal - Order subtotal in dollars
 * @param settings - Global fee configuration
 * @returns Fee calculation result
 *
 * @example
 * // Order below threshold
 * calculateGlobalFee(8.00, {
 *   enabled: true,
 *   threshold: 10.0,
 *   belowPercent: 10.0,
 *   aboveFlat: 1.95
 * })
 * // Returns: { platformFee: 0.80, appliedRule: 'percentage', percentageUsed: 10.0 }
 *
 * @example
 * // Order above threshold
 * calculateGlobalFee(15.00, {
 *   enabled: true,
 *   threshold: 10.0,
 *   belowPercent: 10.0,
 *   aboveFlat: 1.95
 * })
 * // Returns: { platformFee: 1.95, appliedRule: 'flat', flatAmountUsed: 1.95 }
 */
export function calculateGlobalFee(
  subtotal: number,
  settings: GlobalFeeSettings | null | undefined
): FeeCalculationResult {
  // Check if settings exist and are enabled
  if (!settings || !settings.enabled) {
    console.log('💰 Global fee: Disabled or not configured');
    return {
      platformFee: 0,
      appliedRule: 'none',
    };
  }

  const threshold = settings.threshold || 0;

  if (subtotal < threshold) {
    // Order below threshold - apply percentage fee
    const belowPercent = settings.belowPercent || 0;
    const platformFee = Number(((subtotal * belowPercent) / 100).toFixed(2));

    console.log(`💰 Global fee: Below threshold ($${threshold.toFixed(2)})`);
    console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`   Percentage: ${belowPercent}%`);
    console.log(`   Fee: $${platformFee.toFixed(2)}`);

    return {
      platformFee,
      appliedRule: 'percentage',
      percentageUsed: belowPercent,
    };
  } else {
    // Order at or above threshold - apply flat fee
    const aboveFlat = settings.aboveFlat || 0;
    const platformFee = Number(aboveFlat.toFixed(2));

    console.log(`💰 Global fee: At/above threshold ($${threshold.toFixed(2)})`);
    console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`   Flat fee: $${platformFee.toFixed(2)}`);

    return {
      platformFee,
      appliedRule: 'flat',
      flatAmountUsed: aboveFlat,
    };
  }
}

/**
 * Calculate delivery fee (placeholder for future implementation)
 *
 * @param distance - Delivery distance
 * @param pricingTiers - Delivery pricing configuration
 * @returns Delivery fee amount
 */
export function calculateDeliveryFee(
  distance: number,
  pricingTiers: any[] // TODO: Define proper type
): number {
  // This is handled by distance.ts currently
  // Placeholder for potential consolidation
  return 0;
}

/**
 * Calculate tip amount
 *
 * @param subtotal - Order subtotal
 * @param tipPercentage - Tip percentage (e.g., 15, 18, 20)
 * @returns Tip amount
 */
export function calculateTip(
  subtotal: number,
  tipPercentage: number
): number {
  return Number(((subtotal * tipPercentage) / 100).toFixed(2));
}

/**
 * Validate global fee settings
 *
 * @param settings - Global fee settings to validate
 * @returns Validation result with errors if any
 */
export function validateGlobalFeeSettings(
  settings: GlobalFeeSettings
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (settings.threshold < 0) {
    errors.push('Threshold cannot be negative');
  }

  if (settings.belowPercent < 0 || settings.belowPercent > 100) {
    errors.push('Below threshold percentage must be between 0 and 100');
  }

  if (settings.aboveFlat < 0) {
    errors.push('Above threshold flat fee cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
