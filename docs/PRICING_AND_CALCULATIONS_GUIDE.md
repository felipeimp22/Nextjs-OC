# Pricing and Calculations System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Calculation Modules](#calculation-modules)
4. [Data Flow](#data-flow)
5. [Implementation Examples](#implementation-examples)
6. [Testing and Validation](#testing-and-validation)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The pricing and calculations system is the **source of truth** for all monetary calculations in the platform. It ensures consistency across:
- Customer-facing shopping cart
- In-house order creation (kitchen/staff)
- Order checkout and payment processing
- Order management and editing

### Key Principles

1. **Single Source of Truth**: All calculations use centralized utility functions
2. **Dynamic Pricing**: Prices calculated in real-time based on current selections and rules
3. **Tax Compliance**: Accurate tax calculations with support for multiple tax types
4. **Cross-Option Pricing**: Advanced modifier pricing with dependencies between options
5. **Type Safety**: Full TypeScript support for all calculations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALCULATION LAYER (Source of Truth)          │
│                      /lib/utils/                                │
└─────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────────┐  ┌───────────────────┐  ┌──────────────┐
│modifierPricing    │  │orderDraft         │  │tax           │
│Calculator.ts      │  │Calculator.ts      │  │Calculator.ts │
├───────────────────┤  ├───────────────────┤  ├──────────────┤
│• Modifier prices  │  │• Complete orders  │  │• Tax         │
│• Cross-option     │  │• Items + mods     │  │  calculation │
│  rules            │  │• Taxes            │  │• Multiple    │
│• Item totals      │  │• Delivery fees    │  │  tax types   │
│                   │  │• Platform fees    │  │• Compound    │
└───────────────────┘  └───────────────────┘  └──────────────┘
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                               │
                        USED EVERYWHERE
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐
│Cart Store         │  │In-House Orders    │  │Customer Checkout │
│(Customer)         │  │(Kitchen/Staff)    │  │(Payment)         │
├───────────────────┤  ├───────────────────┤  ├──────────────────┤
│useCartStore.ts    │  │OrderModal.tsx     │  │order.actions.ts  │
│                   │  │kitchen.actions.ts │  │                  │
│Uses:              │  │                   │  │Uses:             │
│• calculateItem    │  │Uses:              │  │• calculateOrder  │
│  TotalPrice()     │  │• calculateItem    │  │  Draft()         │
│                   │  │  TotalPrice()     │  │                  │
│                   │  │• Manual tax calc  │  │                  │
└───────────────────┘  └───────────────────┘  └──────────────────┘
```

---

## Calculation Modules

### 1. modifierPricingCalculator.ts

**Purpose**: Core modifier and item price calculations with cross-option pricing support.

**Location**: `/lib/utils/modifierPricingCalculator.ts`

**Main Functions**:

#### `calculateModifierPrice(menuRules, selectedChoices)`

Calculates total modifier price with cross-option rules applied.

```typescript
interface ModifierPricingResult {
  totalModifierPrice: number;
  choiceBreakdown: ChoicePriceBreakdown[];
  errors: string[];
}

const result = calculateModifierPrice(
  { appliedOptions: menuRules },
  [
    { optionId: 'size-opt', choiceId: 'large', quantity: 1 },
    { optionId: 'topping-opt', choiceId: 'pepperoni', quantity: 1 }
  ]
);
```

**Returns**:
- `totalModifierPrice`: Sum of all modifier prices
- `choiceBreakdown`: Detailed breakdown per choice with adjustments applied
- `errors`: Array of any validation errors

**Handles**:
- **Base prices**: From `priceAdjustment` field in choiceAdjustments
- **Cross-option adjustments**: Three types:
  - `multiplier`: Multiply price (e.g., 2x when Large selected)
  - `addition`: Add amount (e.g., +$5 when Large selected)
  - `fixed`: Set to specific price (e.g., $10 when Large selected)

#### `calculateItemTotalPrice(basePrice, menuRules, selectedChoices, quantity)`

Main function for calculating complete item price (base + modifiers × quantity).

```typescript
const result = calculateItemTotalPrice(
  10.00,  // Base menu item price
  { appliedOptions: menuRules },
  [
    { optionId: 'size-opt', choiceId: 'large', quantity: 1 },
    { optionId: 'topping-opt', choiceId: 'pepperoni', quantity: 2 }
  ],
  1  // Item quantity
);

// Result: {
//   basePrice: 10.00,
//   modifierPrice: 11.00,
//   itemTotal: 21.00,
//   total: 21.00,
//   breakdown: { ... }
// }
```

#### `getDefaultSelections(menuRules)`

Extracts default choices from menu rules for auto-selection.

```typescript
const defaults = getDefaultSelections({ appliedOptions: menuRules });
// Returns: [{ optionId, choiceId, quantity }]
```

---

### 2. orderDraftCalculator.ts

**Purpose**: Complete order calculations including items, taxes, fees, and delivery.

**Location**: `/lib/utils/orderDraftCalculator.ts`

**Main Function**: `calculateOrderDraft(input, menuItems, menuRules, options)`

**Input Example**:
```typescript
const draftInput: OrderDraftInput = {
  restaurantId: 'rest-123',
  items: [
    {
      menuItemId: 'item-1',
      quantity: 2,
      selectedOptions: [
        { optionId: 'opt-1', choiceId: 'choice-1', quantity: 1 }
      ]
    }
  ],
  orderType: 'delivery',
  restaurantLocation: { lat: 40.7128, lng: -74.0060 },
  customerLocation: { lat: 40.7589, lng: -73.9851 },
  taxSettings: [...],
  deliveryPricingTiers: [...],
  globalFee: { enabled: true, type: 'percentage', value: 2.5 }
};
```

**Returns**:
```typescript
interface OrderDraftResult {
  items: OrderItemResult[];       // Calculated items
  subtotal: number;                // Sum of all items
  tax: number;                     // Total tax amount
  taxBreakdown: TaxBreakdown[];    // Per-tax breakdown
  deliveryFee: number;             // Distance-based delivery fee
  deliveryDetails: {...};          // Distance, tier used
  tip: number;                     // Tip amount
  platformFee: number;             // Platform fee
  total: number;                   // Grand total
}
```

**Calculation Steps**:
1. **Item Prices**: Calculate each item with modifiers
2. **Subtotal**: Sum all item totals
3. **Taxes**: Apply tax settings (via taxCalculator)
4. **Delivery Fee**: Calculate distance-based fee (if delivery)
5. **Platform Fee**: Apply percentage or fixed fee
6. **Total**: Sum subtotal + tax + delivery + platform fee + tip

**Note**: This module has its own modifier calculation logic (lines 196-340) rather than importing `modifierPricingCalculator`. Both implementations produce identical results but should be unified in future refactoring.

---

### 3. taxCalculator.ts

**Purpose**: Tax calculations with support for multiple tax types and compound taxes.

**Location**: `/lib/utils/taxCalculator.ts`

**Main Function**: `calculateTaxes(items, taxSettings)`

**Supports**:
- **Multiple taxes**: Sales tax, VAT, service tax, etc.
- **Tax types**:
  - `exclusive`: Added to subtotal (US model)
  - `inclusive`: Already included in price (EU/UK model)
- **Compound taxes**: Taxes calculated on subtotal + other taxes
- **Selective application**: Apply different tax rates to different items

**Example**:
```typescript
const taxSettings: TaxSetting[] = [
  {
    id: 'sales-tax',
    name: 'Sales Tax',
    rate: 8.5,
    type: 'exclusive',
    enabled: true,
    isCompound: false
  },
  {
    id: 'service-tax',
    name: 'Service Tax',
    rate: 2.0,
    type: 'exclusive',
    enabled: true,
    isCompound: true  // Applied on subtotal + sales tax
  }
];

const result = calculateTaxes(items, taxSettings);
// Returns: {
//   totalTax: 10.73,
//   breakdown: [
//     { name: 'Sales Tax', rate: 8.5, amount: 8.50 },
//     { name: 'Service Tax', rate: 2.0, amount: 2.23 }
//   ]
// }
```

---

## Data Flow

### 1. Customer Shopping Cart

```
User adds item to cart
    ↓
stores/useCartStore.ts
    ↓
calculateCartItemPrice(item)
    ↓
calculateItemTotalPrice(
  item.basePrice,
  item.menuRules,
  item.selectedOptions,
  item.quantity
)
    ↓
Returns accurate total with cross-option pricing
    ↓
Cart displays correct price
```

**Key Point**: Cart items store `menuRules` with each item for dynamic calculation.

### 2. In-House Order Creation (Kitchen/Staff)

```
Staff creates order
    ↓
components/shared/OrderModal.tsx
    ↓
For each item:
  calculateItemTotalPrice(...)
    ↓
Subtotal = Sum of all items
    ↓
lib/serverActions/kitchen.actions.ts
    ↓
Fetch tax settings from financialSettings
    ↓
Manual tax calculation:
  taxes.forEach(tax => {
    taxAmount = (subtotal * tax.rate) / 100
  })
    ↓
Total = subtotal + tax
    ↓
Create order in database
```

**Key Point**: Tax calculated on backend, but NOT displayed in OrderModal UI (Issue #1)

### 3. Customer Checkout

```
Customer proceeds to checkout
    ↓
lib/serverActions/order.actions.ts
    ↓
Fetch menu items, rules, options, settings
    ↓
Build OrderDraftInput
    ↓
calculateOrderDraft(input, ...)
    ↓
Returns complete breakdown:
  - Items with modifiers
  - Subtotal
  - Tax (via taxCalculator)
  - Delivery fee (via distance calculator)
  - Platform fee
  - Tip
  - Total
    ↓
Create payment intent
    ↓
Create order in database
```

**Key Point**: Most comprehensive calculation, uses orderDraftCalculator which handles everything.

### 4. Dynamic Price Display (Modifiers)

```
User selects size option (e.g., Large)
    ↓
components/kitchen/ItemModifierSelector.tsx
    ↓
calculateChoicePrice(optionId, choiceId, choiceAdjustment)
    ↓
Simulate selection set with this choice
    ↓
calculateModifierPrice({ appliedOptions }, simulatedSelections)
    ↓
Extract price for this choice from breakdown
    ↓
UI updates to show new price
```

**Example Flow**:
- Pepperoni shows $5 (base price)
- User selects Large (+$50 rule on Pepperoni)
- Pepperoni updates to show $55
- Real-time dynamic pricing based on selections

---

## Implementation Examples

### Example 1: Add Item to Cart with Modifiers

```typescript
import { calculateItemTotalPrice } from '@/lib/utils/modifierPricingCalculator';

// Get menu item and rules
const menuItem = { id: '1', name: 'Pizza', price: 10.00 };
const menuRules = getMenuRulesForItem(menuItem.id);

// User selections
const selectedOptions = [
  {
    optionId: 'size-option',
    optionName: 'Size',
    choiceId: 'large',
    choiceName: 'Large',
    quantity: 1,
    priceAdjustment: 5.00
  },
  {
    optionId: 'topping-option',
    optionName: 'Toppings',
    choiceId: 'pepperoni',
    choiceName: 'Pepperoni',
    quantity: 1,
    priceAdjustment: 3.00
  }
];

// Calculate total
const result = calculateItemTotalPrice(
  menuItem.price,
  { appliedOptions: menuRules },
  selectedOptions.map(opt => ({
    optionId: opt.optionId,
    choiceId: opt.choiceId,
    quantity: opt.quantity
  })),
  1
);

// Add to cart
addItem({
  menuItemId: menuItem.id,
  name: menuItem.name,
  basePrice: menuItem.price,
  quantity: 1,
  selectedOptions: selectedOptions,
  menuRules: menuRules,
  total: result.total  // Accurate total with all adjustments
});
```

### Example 2: Create In-House Order with Tax

```typescript
// Frontend (OrderModal)
import { calculateItemTotalPrice } from '@/lib/utils/modifierPricingCalculator';

const items = orderItems.map(item => {
  const result = calculateItemTotalPrice(
    menuItem.price,
    { appliedOptions: itemRules },
    item.selectedModifiers,
    item.quantity
  );

  return {
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    price: result.itemTotal,
    options: item.selectedModifiers,
    specialInstructions: item.specialInstructions
  };
});

const subtotal = items.reduce((sum, item) =>
  sum + (item.price * item.quantity), 0
);

// Backend (kitchen.actions.ts)
const taxes = restaurant.financialSettings?.taxes || [];
let tax = 0;
const taxBreakdown = [];

taxes.forEach(taxSetting => {
  if (taxSetting.enabled) {
    const taxAmount = (subtotal * taxSetting.rate) / 100;
    tax += taxAmount;
    taxBreakdown.push({
      name: taxSetting.name,
      rate: taxSetting.rate,
      amount: taxAmount
    });
  }
});

const total = subtotal + tax;
```

### Example 3: Calculate Order Draft for Checkout

```typescript
import { calculateOrderDraft } from '@/lib/utils/orderDraftCalculator';

// Prepare input
const draftInput: OrderDraftInput = {
  restaurantId,
  items: cartItems.map(item => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    selectedOptions: item.selectedOptions.map(opt => ({
      optionId: opt.optionId,
      choiceId: opt.choiceId,
      quantity: opt.quantity || 1
    }))
  })),
  orderType: 'delivery',
  restaurantLocation: { lat: restaurant.geoLat, lng: restaurant.geoLng },
  customerLocation: { lat: customerLat, lng: customerLng },
  taxSettings: restaurant.financialSettings?.taxes,
  deliveryPricingTiers: restaurant.deliverySettings?.pricingTiers,
  globalFee: restaurant.financialSettings?.globalFee,
  distanceUnit: restaurant.deliverySettings?.distanceUnit || 'miles'
};

// Calculate
const orderDraft = await calculateOrderDraft(
  draftInput,
  menuItemsMap,
  menuRulesMap,
  optionsMap
);

// Result breakdown
console.log('Subtotal:', orderDraft.subtotal);
console.log('Tax:', orderDraft.tax);
console.log('Delivery:', orderDraft.deliveryFee);
console.log('Platform Fee:', orderDraft.platformFee);
console.log('Total:', orderDraft.total);
```

---

## Testing and Validation

### Unit Tests

Test each calculator function independently:

```typescript
describe('calculateItemTotalPrice', () => {
  it('calculates simple item without modifiers', () => {
    const result = calculateItemTotalPrice(10.00, null, [], 1);
    expect(result.total).toBe(10.00);
  });

  it('calculates item with simple modifiers', () => {
    const menuRules = {
      appliedOptions: [{
        optionId: 'size',
        required: false,
        order: 0,
        choiceAdjustments: [{
          choiceId: 'large',
          priceAdjustment: 5.00,
          isAvailable: true,
          isDefault: false,
          adjustments: []
        }]
      }]
    };

    const result = calculateItemTotalPrice(
      10.00,
      menuRules,
      [{ optionId: 'size', choiceId: 'large', quantity: 1 }],
      1
    );

    expect(result.total).toBe(15.00);
  });

  it('applies cross-option multiplier correctly', () => {
    // Test multiplier adjustment
    // pepperoni = $3, when large selected = $3 * 2 = $6
    // Total = $10 (base) + $5 (large) + $6 (pepperoni) = $21
  });

  it('applies cross-option addition correctly', () => {
    // Test addition adjustment
  });

  it('applies cross-option fixed price correctly', () => {
    // Test fixed adjustment
  });
});
```

### Integration Tests

Test complete order flows:

```typescript
describe('Order Calculation Flow', () => {
  it('cart total matches checkout total', async () => {
    // Add items to cart
    const cartTotal = getCartTotal();

    // Calculate order draft
    const orderDraft = await calculateOrderDraft(...);

    // Subtotals should match (before tax/fees)
    expect(cartTotal).toBe(orderDraft.subtotal);
  });

  it('in-house order total matches expected', () => {
    // Create in-house order
    // Verify subtotal, tax, total
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. Price Doubling

**Symptom**: Choice showing $10 but displays as $20

**Cause**: Adding `choice.basePrice + priceAdjustment` when `priceAdjustment` already contains the base price.

**Solution**: Use only `priceAdjustment` from choiceAdjustments:

```typescript
// ❌ WRONG
const finalPrice = choice.basePrice + choiceAdjustment.priceAdjustment;

// ✅ CORRECT
const finalPrice = choiceAdjustment.priceAdjustment;
```

#### 2. Cross-Option Rules Not Working

**Symptom**: Selecting Large doesn't change Pepperoni price

**Cause**: Not using dynamic calculation or missing adjustments array.

**Solution**: Use `calculateChoicePrice()` for display:

```typescript
const calculateChoicePrice = (optionId, choiceId, choiceAdjustment) => {
  // Simulate selection with this choice
  const simulatedSelections = [
    ...currentSelections.filter(s => s.optionId !== optionId),
    { optionId, choiceId, quantity: 1 }
  ];

  const result = calculateModifierPrice(
    { appliedOptions: menuRules },
    simulatedSelections
  );

  return result.choiceBreakdown.find(cb => cb.choiceId === choiceId)?.finalPrice || 0;
};
```

#### 3. Tax Not Showing in UI

**Symptom**: In-house orders don't show tax breakdown

**Cause**: Tax calculated on backend but not displayed in OrderModal.

**Solution**: Fetch tax settings and calculate tax for display (see fixes below).

#### 4. Cart vs Checkout Price Mismatch

**Symptom**: Cart shows $18, checkout shows $21

**Cause**: Cart not using centralized calculator.

**Solution**: Ensure cart uses `calculateItemTotalPrice()`:

```typescript
// stores/useCartStore.ts
const calculateCartItemPrice = (item: CartItem): number => {
  const result = calculateItemTotalPrice(
    item.basePrice,
    { appliedOptions: item.menuRules },
    item.selectedOptions.map(opt => ({
      optionId: opt.optionId,
      choiceId: opt.choiceId,
      quantity: opt.quantity || 1
    })),
    item.quantity
  );
  return result.total;
};
```

---

## Current Issues and Recommendations

### Issue #1: Tax Not Displayed in In-House Orders

**Status**: ❌ **CRITICAL** - Needs immediate fix

**Problem**: OrderModal shows "Estimated Total" but doesn't display tax breakdown to staff.

**Impact**: Staff can't see tax amount before creating order, leading to confusion.

**Recommendation**: Add tax calculation and display to OrderModal UI.

### Issue #2: Multiple Calculation Implementations

**Status**: ⚠️ **MEDIUM** - Technical debt

**Problem**:
- `modifierPricingCalculator.ts` has modifier logic
- `orderDraftCalculator.ts` has duplicate modifier logic (lines 196-340)
- `kitchen.actions.ts` has manual tax calculation

**Impact**: Changes must be made in multiple places, risk of inconsistency.

**Recommendation**: Refactor `orderDraftCalculator` to import and use `modifierPricingCalculator`.

### Issue #3: Missing Fallback Handling

**Status**: ⚠️ **LOW** - Edge case

**Problem**: If calculation fails, error handling varies across implementations.

**Recommendation**: Standardize error handling with graceful fallbacks.

---

## Future Enhancements

1. **Unified Calculator**: Single calculator that handles all scenarios
2. **Caching**: Cache calculation results for performance
3. **Validation**: Stronger validation of menu rules and pricing data
4. **Logging**: Detailed logging for debugging price discrepancies
5. **Preview Mode**: Show price breakdown before confirming selections
6. **Multi-Currency**: Better support for currency conversion in calculations

---

## Related Documentation

- [Menu Rules and Modifiers Guide](./MENU_RULES_AND_MODIFIERS_GUIDE.md) - How to create pricing rules
- [Settings System Guide](./SETTINGS_SYSTEM_GUIDE.md) - Tax and fee configuration
- [Payment Flow](./PAYMENT_FLOW.md) - Payment processing integration
- [Architecture Guide](./ARCHITECTURE.md) - Overall system architecture

---

## Summary

The pricing and calculations system provides:
- ✅ Centralized calculation utilities
- ✅ Dynamic cross-option pricing
- ✅ Accurate tax calculations
- ✅ Real-time price updates
- ✅ Type-safe implementations

**Key Takeaway**: Always use the centralized calculator functions (`calculateItemTotalPrice`, `calculateOrderDraft`, `calculateTaxes`) rather than implementing custom calculation logic.
