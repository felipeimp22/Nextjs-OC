// lib/utils/taxCalculator.ts

/**
 * Centralized Tax Calculation Service
 *
 * This service handles all tax calculations for orders,
 * supporting multiple tax configurations including:
 * - Percentage-based taxes
 * - Fixed-amount taxes
 * - Per-item or entire-order taxation
 */

export interface TaxSetting {
  name: string;
  enabled: boolean;
  rate: number;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

export interface TaxCalculationItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface TaxBreakdown {
  name: string;
  rate: number | null;
  amount: number;
  type: 'percentage' | 'fixed';
}

export interface TaxCalculationResult {
  totalTax: number;
  breakdown: TaxBreakdown[];
  subtotalBeforeTax: number;
  totalWithTax: number;
}

/**
 * Helper to convert dollars to cents for precise calculations
 */
const toCents = (dollars: number): number => Math.round(dollars * 100);

/**
 * Helper to convert cents to dollars
 */
const toDollars = (cents: number): number => Number((cents / 100).toFixed(2));

/**
 * Calculate taxes for an order
 *
 * @param subtotal - Order subtotal in dollars
 * @param items - Array of order items (for per-item taxation)
 * @param taxSettings - Array of tax configurations
 * @returns TaxCalculationResult with breakdown
 */
export function calculateTaxes(
  subtotal: number,
  items: TaxCalculationItem[],
  taxSettings: TaxSetting[]
): TaxCalculationResult {
  // Convert subtotal to cents for precise calculations
  const subtotalCents = toCents(subtotal);
  let totalTaxCents = 0;
  const breakdown: TaxBreakdown[] = [];

  console.log('🧾 Calculating taxes for subtotal:', `$${subtotal.toFixed(2)}`);

  // Process each tax setting
  for (const tax of taxSettings) {
    if (!tax.enabled) {
      console.log(`⏭️  Tax "${tax.name}" is disabled, skipping`);
      continue;
    }

    let taxAmountCents = 0;

    if (tax.type === 'percentage') {
      // Percentage-based tax
      if (tax.applyTo === 'entire_order') {
        // Apply to entire order subtotal
        taxAmountCents = Math.round((subtotalCents * tax.rate) / 100);

        console.log(`📊 ${tax.name}: ${tax.rate}% of $${subtotal.toFixed(2)} = $${toDollars(taxAmountCents).toFixed(2)}`);
      } else {
        // Apply to each item individually
        for (const item of items) {
          const itemTotalCents = toCents(item.total);
          const itemTaxCents = Math.round((itemTotalCents * tax.rate) / 100);
          taxAmountCents += itemTaxCents;

          console.log(`  - ${item.name}: ${tax.rate}% of $${item.total.toFixed(2)} = $${toDollars(itemTaxCents).toFixed(2)}`);
        }

        console.log(`📊 ${tax.name}: Total per-item tax = $${toDollars(taxAmountCents).toFixed(2)}`);
      }

      breakdown.push({
        name: tax.name,
        rate: tax.rate,
        amount: toDollars(taxAmountCents),
        type: 'percentage',
      });
    } else {
      // Fixed-amount tax
      if (tax.applyTo === 'entire_order') {
        // Apply fixed amount once
        taxAmountCents = toCents(tax.rate);

        console.log(`💲 ${tax.name}: Fixed fee $${tax.rate.toFixed(2)}`);
      } else {
        // Apply fixed amount per item
        for (const item of items) {
          const itemFixedTaxCents = toCents(tax.rate) * item.quantity;
          taxAmountCents += itemFixedTaxCents;

          console.log(`  - ${item.name} (${item.quantity}x): $${tax.rate.toFixed(2)} each = $${toDollars(itemFixedTaxCents).toFixed(2)}`);
        }

        console.log(`💲 ${tax.name}: Total per-item fee = $${toDollars(taxAmountCents).toFixed(2)}`);
      }

      breakdown.push({
        name: tax.name,
        rate: null, // No rate for fixed taxes
        amount: toDollars(taxAmountCents),
        type: 'fixed',
      });
    }

    totalTaxCents += taxAmountCents;
  }

  const result = {
    totalTax: toDollars(totalTaxCents),
    breakdown,
    subtotalBeforeTax: subtotal,
    totalWithTax: toDollars(subtotalCents + totalTaxCents),
  };

  console.log('✅ Tax calculation complete:', {
    subtotal: `$${result.subtotalBeforeTax.toFixed(2)}`,
    totalTax: `$${result.totalTax.toFixed(2)}`,
    total: `$${result.totalWithTax.toFixed(2)}`,
  });

  return result;
}

/**
 * Calculate a single tax for quick calculations
 *
 * @param amount - Amount to apply tax to
 * @param rate - Tax rate (percentage or fixed amount)
 * @param type - 'percentage' or 'fixed'
 * @returns Tax amount
 */
export function calculateSingleTax(
  amount: number,
  rate: number,
  type: 'percentage' | 'fixed' = 'percentage'
): number {
  if (type === 'percentage') {
    return Number((amount * (rate / 100)).toFixed(2));
  } else {
    return rate;
  }
}

/**
 * Calculate effective tax rate (total tax as percentage of subtotal)
 *
 * @param subtotal - Order subtotal
 * @param totalTax - Total tax amount
 * @returns Effective tax rate as percentage
 */
export function calculateEffectiveTaxRate(
  subtotal: number,
  totalTax: number
): number {
  if (subtotal === 0) return 0;
  return Number(((totalTax / subtotal) * 100).toFixed(2));
}

/**
 * Validate tax settings
 *
 * @param taxSettings - Array of tax settings to validate
 * @returns Object with validation result and errors if any
 */
export function validateTaxSettings(taxSettings: TaxSetting[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const tax of taxSettings) {
    if (!tax.name) {
      errors.push('Tax name is required');
    }

    if (tax.type === 'percentage') {
      if (tax.rate < 0 || tax.rate > 100) {
        errors.push(`Tax "${tax.name}": Percentage rate must be between 0 and 100`);
      }
    } else if (tax.type === 'fixed') {
      if (tax.rate < 0) {
        errors.push(`Tax "${tax.name}": Fixed amount cannot be negative`);
      }
    }

    if (!['entire_order', 'per_item'].includes(tax.applyTo)) {
      errors.push(`Tax "${tax.name}": Invalid applyTo value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate tax refund amount (useful for partial or full refunds)
 *
 * @param originalSubtotal - Original order subtotal
 * @param refundSubtotal - Subtotal being refunded
 * @param originalTax - Original tax amount
 * @returns Refunded tax amount
 */
export function calculateTaxRefund(
  originalSubtotal: number,
  refundSubtotal: number,
  originalTax: number
): number {
  if (originalSubtotal === 0) return 0;

  // Calculate proportional tax refund
  const refundRatio = refundSubtotal / originalSubtotal;
  return Number((originalTax * refundRatio).toFixed(2));
}
