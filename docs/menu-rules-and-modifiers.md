# Menu Rules and Modifiers System

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Data Structure](#data-structure)
4. [Pricing Logic](#pricing-logic)
5. [Use Cases and Examples](#use-cases-and-examples)
6. [UI Components](#ui-components)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)

---

## Overview

The Menu Rules and Modifiers System is a powerful feature that allows restaurant owners to create complex, dynamic pricing for menu items based on customer selections. It enables sophisticated pricing strategies where one modifier choice can affect the price of other modifiers.

### Key Features

- **Flexible Modifier Assignment**: Attach multiple modifiers (options) to any menu item
- **Dynamic Pricing**: Choice prices can change based on other selections
- **Three Adjustment Types**: Multiplier, Addition, and Fixed price adjustments
- **Required/Optional Modifiers**: Mark modifiers as required or optional
- **Default Selections**: Set default choices for better UX
- **Order Control**: Define the order modifiers appear to customers

---

## Core Concepts

### 1. **Options (Modifiers)**

Options are customization categories that can be applied to menu items. Examples:
- Size (Small, Medium, Large)
- Toppings (Cheese, Pepperoni, Vegetables)
- Temperature (Hot, Cold, Extra Hot)
- Cooking Level (Rare, Medium, Well Done)

### 2. **Choices**

Each option contains multiple choices that customers can select. For example:
- Option: "Size" → Choices: "Small", "Medium", "Large"
- Option: "Toppings" → Choices: "Cheese", "Pepperoni", "Mushrooms"

### 3. **Applied Options**

When you attach an option to a menu item, it becomes an "Applied Option" with specific configuration:
- **Required**: Whether the customer must make a selection
- **Order**: The sequence in which options are presented
- **Choice Adjustments**: Custom pricing and availability for each choice

### 4. **Choice Adjustments**

For each choice in an applied option, you can configure:
- **Price Adjustment**: The base price for this choice
- **Available**: Whether this choice is currently available
- **Default**: Whether this choice is pre-selected
- **Price Adjustment Rules**: Dynamic pricing based on other selections

### 5. **Price Adjustment Rules (Cross-Modifier Pricing)**

The most powerful feature - rules that change a choice's price based on other modifier selections. Three types:

#### **Addition**
Adds a fixed amount to the base price.
```
Base Price: $5.00
Addition: +$2.00
Final Price: $7.00
```

#### **Multiplier**
Multiplies the base price by a factor.
```
Base Price: $5.00
Multiplier: 2x
Final Price: $10.00
```

#### **Fixed**
Replaces the base price entirely.
```
Base Price: $5.00
Fixed: $15.00
Final Price: $15.00 (ignores base price)
```

---

## Data Structure

### MenuRules Model

```typescript
model MenuRules {
  id            String           @id @default(auto()) @map("_id") @db.ObjectId
  menuItemId    String           @unique @db.ObjectId
  restaurantId  String           @db.ObjectId
  appliedOptions AppliedOption[]
}

type AppliedOption {
  optionId          String               @db.ObjectId
  required          Boolean              @default(false)
  order             Int                  @default(0)
  choiceAdjustments ChoiceAdjustment[]
}

type ChoiceAdjustment {
  choiceId        String
  priceAdjustment Float               @default(0)
  isAvailable     Boolean             @default(true)
  isDefault       Boolean             @default(false)
  adjustments     PriceAdjustment[]
}

type PriceAdjustment {
  targetOptionId   String   @db.ObjectId
  targetChoiceId   String?  // Optional - applies to specific choice or all choices
  adjustmentType   String   // "multiplier", "addition", "fixed"
  value           Float
}
```

---

## Pricing Logic

### How Prices are Calculated

The system calculates modifier prices in this sequence:

1. **Start with Base Price**: Each choice has a base `priceAdjustment` value
2. **Apply Cross-Modifier Rules**: If the customer selected a trigger modifier:
   - Find matching price adjustment rules
   - Apply rules based on type (multiplier, addition, or fixed)
3. **Multiply by Quantity**: If choices allow quantity, multiply final price
4. **Sum All Modifiers**: Add all choice prices to the item's base price

### Calculation Example

**Menu Item**: Pizza ($10.00 base price)

**Option 1 - Size**:
- Small: +$0.00
- Medium: +$5.00
- Large: +$10.00

**Option 2 - Toppings**:
- Cheese: +$2.00
- Pepperoni: +$3.00
  - **Rule**: When "Large" size is selected, multiply by 2
- Mushrooms: +$2.00
  - **Rule**: When "Small" size is selected, set fixed price to $0.00

**Customer Selects**: Large + Pepperoni + Mushrooms

**Calculation**:
```
Base Pizza:           $10.00
Size (Large):         +$10.00
Pepperoni:            $3.00 × 2 (Large trigger) = $6.00
Mushrooms:            $2.00 (no rule triggered)
─────────────────────────────
Total:                $28.00
```

**If Customer Selected**: Small + Pepperoni + Mushrooms

**Calculation**:
```
Base Pizza:           $10.00
Size (Small):         +$0.00
Pepperoni:            $3.00 (no rule for Small)
Mushrooms:            $0.00 (fixed price when Small)
─────────────────────────────
Total:                $13.00
```

### Price Calculation Function

The system provides a utility function for calculating prices:

```typescript
import { calculateItemTotalPrice } from '@/lib/utils/modifierPricingCalculator';

const result = calculateItemTotalPrice(
  basePrice,      // Item's base price
  menuRules,      // MenuRules object
  selectedChoices, // Array of customer selections
  quantity        // Item quantity
);

// Returns:
{
  basePrice: number;        // Original item price
  modifierPrice: number;    // Total modifier cost
  itemTotal: number;        // Base + modifiers
  total: number;           // Item total × quantity
  breakdown: {
    totalModifierPrice: number;
    choiceBreakdown: Array<{
      choiceId: string;
      basePrice: number;
      finalPrice: number;
      adjustmentsApplied: Array<{
        type: string;
        value: number;
        triggerOptionId: string;
        triggerChoiceId?: string;
      }>;
    }>;
    errors: string[];
  };
}
```

---

## Use Cases and Examples

### Use Case 1: Size-Based Topping Pricing

**Scenario**: Pizza toppings cost more on larger pizzas.

**Setup**:
1. Create "Size" option: Small ($0), Medium ($5), Large ($10)
2. Create "Toppings" option: Extra Cheese ($2), Pepperoni ($3), etc.
3. For Pepperoni choice, add rules:
   - When Medium selected: multiply by 1.5
   - When Large selected: multiply by 2

**Result**:
- Small Pizza + Pepperoni = $3.00
- Medium Pizza + Pepperoni = $4.50 (×1.5)
- Large Pizza + Pepperoni = $6.00 (×2)

### Use Case 2: Combo Deal Pricing

**Scenario**: When ordering a combo meal, drinks are discounted.

**Setup**:
1. Create "Meal Type" option: Single ($0), Combo ($5)
2. Create "Drink" option: Soda ($3), Juice ($4)
3. For drink choices, add rules:
   - When Combo selected: fixed price $1.00

**Result**:
- Single + Soda = $3.00
- Combo + Soda = $1.00 (discounted)

### Use Case 3: Premium Add-ons

**Scenario**: Premium toppings add a flat fee regardless of base price.

**Setup**:
1. Create "Base Type" option: Regular ($0), Whole Wheat ($2)
2. Create "Premium Toppings" option: Truffle Oil ($5)
3. For Truffle Oil, add rule:
   - When Whole Wheat selected: add $2 extra

**Result**:
- Regular + Truffle Oil = $5.00
- Whole Wheat + Truffle Oil = $7.00 ($5 + $2 addition)

### Use Case 4: All-Inclusive Pricing

**Scenario**: Small size includes all toppings for free.

**Setup**:
1. Create "Size" option: Small ($8), Medium ($12), Large ($15)
2. Create "Toppings" option: All toppings normally $2 each
3. For all topping choices, add rule:
   - When Small selected: fixed price $0.00

**Result**:
- Small + 5 toppings = $8.00 (all free)
- Medium + 5 toppings = $22.00 ($12 + $10 in toppings)

---

## UI Components

### Component Hierarchy

```
MenuItemsList
  └─ MenuItemModifiersModal (Main modal)
      ├─ ModifierSelector (Step 1: Select modifiers)
      └─ ModifierConfiguration (Step 2: Configure)
          └─ ChoiceAdjustmentEditor (For each modifier)
              └─ PriceAdjustmentRuleEditor (Cross-modifier rules)
```

### Usage Flow

1. **MenuItemsList**: User clicks "Manage Modifiers" button on a menu item
2. **MenuItemModifiersModal**: Opens with two steps:
   - **Step 1 - Select**: Choose which modifiers apply to this item
   - **Step 2 - Configure**: Set up pricing and rules
3. **ModifierConfiguration**:
   - Reorder modifiers (affects customer view)
   - Mark as required/optional
   - Expand each modifier to configure choices
4. **ChoiceAdjustmentEditor**:
   - Set individual choice prices
   - Mark choices as available/default
   - Add cross-modifier price rules
5. **PriceAdjustmentRuleEditor**:
   - Select trigger modifier and choice
   - Choose adjustment type (add/multiply/fixed)
   - Set adjustment value
   - See real-time calculation preview

### Mobile Responsiveness

All components are fully responsive:
- **Desktop**: Multi-column layouts, side-by-side controls
- **Mobile**: Stacked layouts, full-width buttons, touch-friendly
- Uses `useMobile()` hook to adapt layout

---

## API Reference

### Server Actions

#### `getMenuRules(menuItemId: string)`

Fetches the menu rules for a specific menu item.

**Returns**:
```typescript
{
  success: boolean;
  data: MenuRules | null;
  error: string | null;
}
```

#### `createOrUpdateMenuRules(data)`

Creates or updates menu rules for a menu item.

**Parameters**:
```typescript
{
  menuItemId: string;
  restaurantId: string;
  appliedOptions: Array<{
    optionId: string;
    required: boolean;
    order: number;
    choiceAdjustments: Array<{
      choiceId: string;
      priceAdjustment: number;
      isAvailable?: boolean;
      isDefault?: boolean;
      adjustments?: Array<{
        targetOptionId: string;
        targetChoiceId?: string;
        adjustmentType: 'multiplier' | 'addition' | 'fixed';
        value: number;
      }>;
    }>;
  }>;
}
```

**Returns**: Same as getMenuRules

#### `deleteMenuRules(menuItemId: string, restaurantId: string)`

Removes all menu rules from a menu item.

**Returns**:
```typescript
{
  success: boolean;
  data: null;
  error: string | null;
}
```

### Utility Functions

#### `calculateModifierPrice(menuRules, selectedChoices)`

Calculates the total modifier price based on selections.

#### `validateMenuRules(menuRules)`

Validates menu rules structure and returns errors.

#### `getDefaultSelections(menuRules)`

Returns the default choice selections for a menu item.

#### `calculateItemTotalPrice(basePrice, menuRules, selectedChoices, quantity)`

Calculates the complete item price including modifiers.

---

## Best Practices

### 1. **Keep It Simple for Customers**

- Don't create too many cross-modifier rules
- Use clear, descriptive names for options and choices
- Set sensible defaults to guide customers

### 2. **Logical Rule Ordering**

- Put fundamental options first (e.g., Size before Toppings)
- The order affects rule application and customer flow

### 3. **Test Your Pricing**

- Use the calculation preview to verify rules work correctly
- Test edge cases (all combinations if possible)
- Verify prices make sense from customer perspective

### 4. **Avoid Circular Dependencies**

- Don't create rules where Option A affects Option B and B affects A
- The system applies rules in order, so circular logic won't work as expected

### 5. **Use Multipliers Wisely**

- Multiplier of 0 makes an item free (useful for combos)
- Multiplier > 1 increases price (e.g., premium sizes)
- Multiplier < 1 decreases price (e.g., discounts)

### 6. **Document Complex Rules**

- Add descriptions to options explaining the pricing
- Train staff on how complex rules work
- Keep a reference guide for your specific setup

### 7. **Monitor and Adjust**

- Review sales data to see which combinations customers choose
- Adjust pricing rules based on actual usage
- Remove unused or confusing options

---

## Common Patterns

### Pattern 1: Size Multipliers

All toppings cost more on larger sizes.

```typescript
// Each topping has rules:
[
  {
    targetOptionId: "size-option-id",
    targetChoiceId: "medium-id",
    adjustmentType: "multiplier",
    value: 1.5
  },
  {
    targetOptionId: "size-option-id",
    targetChoiceId: "large-id",
    adjustmentType: "multiplier",
    value: 2
  }
]
```

### Pattern 2: Combo Discounts

When combo is selected, drinks are cheaper.

```typescript
// Each drink has rule:
[
  {
    targetOptionId: "meal-type-id",
    targetChoiceId: "combo-id",
    adjustmentType: "fixed",
    value: 1.00 // Fixed $1 instead of regular $3
  }
]
```

### Pattern 3: Premium Surcharges

Certain bases add extra cost to all toppings.

```typescript
// Each topping has rule:
[
  {
    targetOptionId: "base-id",
    targetChoiceId: "premium-base-id",
    adjustmentType: "addition",
    value: 0.50 // Add 50¢ to each topping
  }
]
```

### Pattern 4: All-Inclusive

Small size includes everything for free.

```typescript
// Each topping/option has rule:
[
  {
    targetOptionId: "size-id",
    targetChoiceId: "small-id",
    adjustmentType: "fixed",
    value: 0.00 // Everything free on small
  }
]
```

---

## Troubleshooting

### Issue: Prices Don't Update

**Cause**: Rules may reference wrong option/choice IDs

**Solution**:
- Verify IDs in database match the rules
- Delete and recreate rules if IDs changed
- Check browser console for calculation errors

### Issue: Rules Not Applying

**Cause**: Customer hasn't selected the trigger choice

**Solution**:
- Rules only apply when trigger is selected
- Use `targetChoiceId: undefined` to trigger on any choice from an option

### Issue: Unexpected Prices

**Cause**: Multiple rules applying or wrong adjustment type

**Solution**:
- Only one rule per trigger applies (last one wins)
- Check adjustment type (fixed vs. addition vs. multiplier)
- Review calculation breakdown in the utility function

### Issue: Can't Save Rules

**Cause**: Validation errors or missing data

**Solution**:
- Ensure all modifiers still exist
- Check that choice IDs are valid
- Verify no circular references

---

## Future Enhancements

Potential improvements to the system:

1. **Rule Priorities**: Allow multiple rules with priority ordering
2. **Conditional Rules**: "If Size=Large AND Base=Premium, then..."
3. **Time-Based Pricing**: Different rules for happy hour, lunch, dinner
4. **Quantity-Based Discounts**: "Buy 2 toppings, get 3rd free"
5. **Customer Group Pricing**: Different rules for members vs. guests
6. **A/B Testing**: Test different pricing strategies
7. **Analytics Dashboard**: Track which modifier combinations sell best

---

## Summary

The Menu Rules and Modifiers System provides a powerful, flexible way to create dynamic pricing for menu items. By understanding the core concepts of options, choices, and price adjustment rules, you can create sophisticated pricing strategies that maximize revenue while providing clear value to customers.

Key takeaways:
- Start simple, add complexity as needed
- Test thoroughly before going live
- Monitor customer behavior and adjust
- Keep the customer experience clear and intuitive
- Use the calculation utilities to verify pricing logic

For technical support or questions, refer to the API documentation or contact the development team.
