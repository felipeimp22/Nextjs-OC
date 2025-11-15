# Calculation Utilities Guide

## Overview

This guide documents the centralized calculation utilities used throughout the application for consistent tax and fee calculations across all order flows (in-house orders, shopping cart, customer-facing checkout).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Kitchen    │  │  Shopping    │  │  Customer    │      │
│  │   Orders     │  │    Cart      │  │   Checkout   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐             ┌─────────────────────┐
│  Tax Calculator     │             │  Fee Calculator     │
│  (taxCalculator.ts) │             │ (feeCalculator.ts)  │
└─────────────────────┘             └─────────────────────┘
```

---

## Core Utilities

### 1. Tax Calculator (`/lib/utils/taxCalculator.ts`)

**Purpose**: Centralized tax calculation with support for multiple tax types and application methods.

#### Features
- ✅ Percentage taxes (e.g., 8.5%)
- ✅ Fixed amount taxes (e.g., $2.00)
- ✅ Apply to entire order subtotal
- ✅ Apply per individual item
- ✅ Multiple taxes combined
- ✅ Detailed breakdown for display
- ✅ Cents-based precision

#### Interface

```typescript
export interface TaxSetting {
  id?: string;
  name: string;
  rate: number;
  enabled: boolean;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

export interface TaxCalculationItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface TaxCalculationResult {
  totalTax: number;
  breakdown: Array<{
    name: string;
    rate: number;
    amount: number;
    type: 'percentage' | 'fixed';
    appliedTo: 'entire_order' | 'per_item';
  }>;
}
```

#### Main Function

```typescript
export function calculateTaxes(
  subtotal: number,
  items: TaxCalculationItem[],
  taxSettings: TaxSetting[]
): TaxCalculationResult
```

#### Tax Calculation Logic

**1. Percentage Tax on Entire Order**
```
Tax = (Subtotal × Rate) ÷ 100

Example:
Subtotal: $100.00
Rate: 8.5%
Tax = ($100.00 × 8.5) ÷ 100 = $8.50
```

**2. Fixed Tax on Entire Order**
```
Tax = Rate

Example:
Rate: $2.00
Tax = $2.00 (flat fee regardless of order size)
```

**3. Percentage Tax Per Item**
```
Tax = Σ [(Item Total × Rate) ÷ 100] for each item

Example:
Item 1: $10.00 × 2 = $20.00
Item 2: $15.00 × 1 = $15.00
Rate: 8.5%

Tax = [($20.00 × 8.5) ÷ 100] + [($15.00 × 8.5) ÷ 100]
    = $1.70 + $1.28
    = $2.98
```

**4. Fixed Tax Per Item**
```
Tax = Σ (Rate × Quantity) for each item

Example:
Item 1: Quantity 2
Item 2: Quantity 1
Rate: $0.50 per item

Tax = ($0.50 × 2) + ($0.50 × 1)
    = $1.00 + $0.50
    = $1.50
```

#### Usage Example

```typescript
import { calculateTaxes, TaxSetting, TaxCalculationItem } from '@/lib/utils/taxCalculator';

// Define tax settings
const taxSettings: TaxSetting[] = [
  {
    name: 'Sales Tax',
    rate: 8.5,
    enabled: true,
    type: 'percentage',
    applyTo: 'entire_order',
  },
  {
    name: 'Container Fee',
    rate: 0.25,
    enabled: true,
    type: 'fixed',
    applyTo: 'per_item',
  }
];

// Prepare order items
const items: TaxCalculationItem[] = [
  {
    name: 'Burger',
    price: 10.00,
    quantity: 2,
    total: 20.00,
  },
  {
    name: 'Fries',
    price: 5.00,
    quantity: 1,
    total: 5.00,
  }
];

const subtotal = 25.00;

// Calculate taxes
const result = calculateTaxes(subtotal, items, taxSettings);

console.log(result);
// {
//   totalTax: 2.88,
//   breakdown: [
//     {
//       name: 'Sales Tax',
//       rate: 8.5,
//       amount: 2.13,
//       type: 'percentage',
//       appliedTo: 'entire_order'
//     },
//     {
//       name: 'Container Fee',
//       rate: 0.25,
//       amount: 0.75,
//       type: 'fixed',
//       appliedTo: 'per_item'
//     }
//   ]
// }
```

---

### 2. Fee Calculator (`/lib/utils/feeCalculator.ts`)

**Purpose**: Centralized platform/global fee calculation with threshold-based logic.

#### Features
- ✅ Threshold-based fee structure
- ✅ Percentage fee for orders below threshold
- ✅ Flat fee for orders at/above threshold
- ✅ Detailed calculation metadata
- ✅ Validation utilities

#### Interface

```typescript
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
```

#### Main Function

```typescript
export function calculateGlobalFee(
  subtotal: number,
  settings: GlobalFeeSettings | null | undefined
): FeeCalculationResult
```

#### Fee Calculation Logic

**Threshold-Based Logic**

```
IF subtotal < threshold:
    Fee = (Subtotal × BelowPercent) ÷ 100

IF subtotal >= threshold:
    Fee = AboveFlat

IF disabled:
    Fee = 0
```

**Examples**

```typescript
// Example 1: Order below threshold
Settings: {
  enabled: true,
  threshold: 10.00,
  belowPercent: 10.0,
  aboveFlat: 1.95
}

Subtotal: $8.00
Fee = ($8.00 × 10.0) ÷ 100 = $0.80

// Example 2: Order at/above threshold
Subtotal: $15.00
Fee = $1.95 (flat)

// Example 3: Disabled
Settings: { enabled: false, ... }
Fee = $0.00
```

#### Usage Example

```typescript
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';

const settings: GlobalFeeSettings = {
  enabled: true,
  threshold: 10.00,
  belowPercent: 10.0,
  aboveFlat: 1.95
};

// Small order (below threshold)
const result1 = calculateGlobalFee(8.00, settings);
console.log(result1);
// {
//   platformFee: 0.80,
//   appliedRule: 'percentage',
//   percentageUsed: 10.0
// }

// Large order (above threshold)
const result2 = calculateGlobalFee(15.00, settings);
console.log(result2);
// {
//   platformFee: 1.95,
//   appliedRule: 'flat',
//   flatAmountUsed: 1.95
// }
```

---

## Backend Integration

### Server Actions (`/lib/serverActions/kitchen.actions.ts`)

Both `createInHouseOrder` and `updateInHouseOrder` functions use the centralized utilities:

```typescript
import { calculateTaxes, TaxSetting, TaxCalculationItem } from '@/lib/utils/taxCalculator';
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';

export async function createInHouseOrder(input: CreateInHouseOrderInput) {
  // ... order items calculation ...

  // CALCULATE TAXES
  const taxSettings = (restaurant.financialSettings?.taxes as TaxSetting[]) || [];
  const taxCalculationItems: TaxCalculationItem[] = orderItems.map(item => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity,
  }));

  const taxResult = calculateTaxes(subtotal, taxCalculationItems, taxSettings);
  const tax = taxResult.totalTax;
  const taxBreakdown = taxResult.breakdown;

  // CALCULATE GLOBAL FEE
  const globalFeeSettings = restaurant.financialSettings?.globalFee as GlobalFeeSettings;
  const feeResult = calculateGlobalFee(subtotal, globalFeeSettings);
  const platformFee = feeResult.platformFee;

  const total = subtotal + tax + platformFee;

  // ... save order to database ...
}
```

---

## Frontend Integration

### OrderModal Component

The frontend `OrderModal.tsx` currently has its own calculation logic to provide real-time updates. This duplicates the backend logic but ensures consistency.

**Current Pattern**:
```typescript
// Frontend calculates for display
const calculateTaxes = () => {
  // Same logic as backend utility
  // Provides instant feedback without server roundtrip
};

const calculatePlatformFee = () => {
  // Same logic as backend utility
  // Provides instant feedback without server roundtrip
};
```

**Future Consideration**: Create a shared isomorphic calculation module that works in both client and server contexts.

---

## Complete Order Calculation Flow

### Full Pricing Breakdown

```
1. SUBTOTAL
   └─> Sum of all items (base price + modifiers) × quantity

2. TAXES (calculateTaxes)
   ├─> Tax 1: Applied based on type + applyTo setting
   ├─> Tax 2: Applied based on type + applyTo setting
   └─> Tax N: Applied based on type + applyTo setting

3. PLATFORM FEE (calculateGlobalFee)
   └─> Fee based on threshold comparison

4. DELIVERY FEE (if applicable)
   └─> Based on distance tiers

5. TIP (if applicable)
   └─> Percentage or custom amount

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. TOTAL = Subtotal + Taxes + Platform Fee + Delivery Fee + Tip
```

### Example Calculation

```
Order Details:
- Burger ($10.00) × 2 = $20.00
- Fries ($5.00) × 1 = $5.00

Tax Settings:
1. Sales Tax: 8.5% on entire order
2. Container Fee: $0.25 per item (fixed)

Global Fee Settings:
- Threshold: $10.00
- Below: 10%
- Above: $1.95

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Calculation:
1. Subtotal = $25.00

2. Taxes:
   - Sales Tax = $25.00 × 0.085 = $2.13
   - Container Fee = $0.25 × 3 items = $0.75
   Total Tax = $2.88

3. Platform Fee:
   - Subtotal $25.00 >= $10.00 threshold
   - Apply flat fee = $1.95

4. Total = $25.00 + $2.88 + $1.95 = $29.83
```

---

## Testing

### Tax Calculator Tests

```typescript
// Test 1: Percentage on entire order
const result = calculateTaxes(100, items, [{
  name: 'Sales Tax',
  rate: 8.5,
  type: 'percentage',
  applyTo: 'entire_order',
  enabled: true
}]);
expect(result.totalTax).toBe(8.50);

// Test 2: Fixed per item
const result = calculateTaxes(100, [
  { name: 'Item', price: 10, quantity: 3, total: 30 }
], [{
  name: 'Container Fee',
  rate: 0.50,
  type: 'fixed',
  applyTo: 'per_item',
  enabled: true
}]);
expect(result.totalTax).toBe(1.50); // $0.50 × 3

// Test 3: Multiple taxes
const result = calculateTaxes(100, items, [
  { name: 'Tax 1', rate: 5, type: 'percentage', applyTo: 'entire_order', enabled: true },
  { name: 'Tax 2', rate: 1.00, type: 'fixed', applyTo: 'entire_order', enabled: true }
]);
expect(result.totalTax).toBe(6.00); // $5.00 + $1.00
```

### Fee Calculator Tests

```typescript
// Test 1: Below threshold
const result = calculateGlobalFee(8.00, {
  enabled: true,
  threshold: 10.00,
  belowPercent: 10.0,
  aboveFlat: 1.95
});
expect(result.platformFee).toBe(0.80);
expect(result.appliedRule).toBe('percentage');

// Test 2: Above threshold
const result = calculateGlobalFee(15.00, {
  enabled: true,
  threshold: 10.00,
  belowPercent: 10.0,
  aboveFlat: 1.95
});
expect(result.platformFee).toBe(1.95);
expect(result.appliedRule).toBe('flat');

// Test 3: Disabled
const result = calculateGlobalFee(15.00, { enabled: false, ... });
expect(result.platformFee).toBe(0);
expect(result.appliedRule).toBe('none');
```

---

## Validation Utilities

### Tax Settings Validation

```typescript
import { validateTaxSettings } from '@/lib/utils/taxCalculator';

const validation = validateTaxSettings({
  name: 'Sales Tax',
  rate: 8.5,
  type: 'percentage',
  applyTo: 'entire_order',
  enabled: true
});

if (!validation.valid) {
  console.error('Invalid tax settings:', validation.errors);
}
```

### Global Fee Validation

```typescript
import { validateGlobalFeeSettings } from '@/lib/utils/feeCalculator';

const validation = validateGlobalFeeSettings({
  enabled: true,
  threshold: 10.00,
  belowPercent: 10.0,
  aboveFlat: 1.95
});

if (!validation.valid) {
  console.error('Invalid fee settings:', validation.errors);
}
```

---

## Best Practices

### 1. Always Use Centralized Utilities

❌ **Bad**: Duplicating calculation logic
```typescript
// DON'T DO THIS
const tax = (subtotal * 0.085);
```

✅ **Good**: Using centralized utility
```typescript
import { calculateTaxes } from '@/lib/utils/taxCalculator';
const result = calculateTaxes(subtotal, items, taxSettings);
```

### 2. Handle Null/Undefined Settings

```typescript
// Always provide fallbacks
const taxSettings = (restaurant.financialSettings?.taxes as TaxSetting[]) || [];
const globalFeeSettings = restaurant.financialSettings?.globalFee || null;

// Utilities handle null/undefined gracefully
const feeResult = calculateGlobalFee(subtotal, globalFeeSettings);
// Returns { platformFee: 0, appliedRule: 'none' } if settings are null
```

### 3. Log Calculations for Debugging

```typescript
console.log('=== TAX CALCULATION ===');
console.log('Subtotal:', `$${subtotal.toFixed(2)}`);
const taxResult = calculateTaxes(subtotal, items, taxSettings);
console.log('Tax:', `$${taxResult.totalTax.toFixed(2)}`);
console.log('Breakdown:', taxResult.breakdown);
```

### 4. Preserve Precision

```typescript
// Utilities use Number() and toFixed(2) for cents-based precision
const platformFee = Number(((subtotal * belowPercent) / 100).toFixed(2));
```

### 5. Validate Before Saving

```typescript
// Validate settings before saving to database
const validation = validateTaxSettings(newTaxSetting);
if (!validation.valid) {
  return { success: false, errors: validation.errors };
}
```

---

## Migration Guide

### Refactoring Existing Code

**Before:**
```typescript
// Duplicated logic in multiple files
const tax = (subtotal * 0.085);
const platformFee = subtotal < 10 ? subtotal * 0.1 : 1.95;
```

**After:**
```typescript
import { calculateTaxes, TaxSetting } from '@/lib/utils/taxCalculator';
import { calculateGlobalFee, GlobalFeeSettings } from '@/lib/utils/feeCalculator';

const taxResult = calculateTaxes(subtotal, items, taxSettings);
const feeResult = calculateGlobalFee(subtotal, globalFeeSettings);

const tax = taxResult.totalTax;
const platformFee = feeResult.platformFee;
```

---

## Future Enhancements

### Planned Features

1. **Delivery Fee Calculator**: Consolidate distance-based delivery fee logic
2. **Tip Calculator**: Standardize tip calculation across flows
3. **Discount Calculator**: Handle promo codes and discounts
4. **Isomorphic Module**: Shared calculations for client and server
5. **Caching**: Memoize calculation results for performance
6. **Analytics**: Track fee/tax impact on orders

### Extensibility

The utility pattern makes it easy to add new calculation types:

```typescript
// Example: Future discount calculator
export function calculateDiscount(
  subtotal: number,
  discountSettings: DiscountSettings
): DiscountCalculationResult {
  // Centralized discount logic
}
```

---

## Troubleshooting

### Issue: Taxes not calculating

**Check:**
1. Are taxes enabled in financial settings?
2. Is `taxSettings` array being passed correctly?
3. Check console logs for calculation details

```typescript
console.log('Tax Settings:', taxSettings);
console.log('Tax Result:', calculateTaxes(subtotal, items, taxSettings));
```

### Issue: Platform fee incorrect

**Check:**
1. Is global fee enabled?
2. Is threshold value correct?
3. Is subtotal calculated before fee?

```typescript
console.log('Global Fee Settings:', globalFeeSettings);
console.log('Subtotal:', subtotal);
console.log('Fee Result:', calculateGlobalFee(subtotal, globalFeeSettings));
```

### Issue: Frontend/backend mismatch

**Check:**
1. Are both using same calculation logic?
2. Are settings fetched correctly on frontend?
3. Compare console logs from both

---

## Related Documentation

- [PRICING_AND_CALCULATIONS_GUIDE.md](./PRICING_AND_CALCULATIONS_GUIDE.md) - Complete pricing system overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SETTINGS_SYSTEM_GUIDE.md](./SETTINGS_SYSTEM_GUIDE.md) - Financial settings configuration

---

## Summary

The centralized calculation utilities provide:
- ✅ **Consistency**: Same logic across all order flows
- ✅ **Maintainability**: Single source of truth for calculations
- ✅ **Flexibility**: Support for multiple tax types and fee structures
- ✅ **Testability**: Easy to test calculation logic in isolation
- ✅ **Reusability**: Use in backend, frontend, and future features
- ✅ **Precision**: Cents-based calculations for financial accuracy
- ✅ **Debugging**: Comprehensive logging and validation
