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

Each option can be configured with:
- **multiSelect**: Allow customers to select multiple choices (e.g., multiple toppings)
- **minSelections**: Minimum number of choices that must be selected (for multiSelect)
- **maxSelections**: Maximum number of choices that can be selected (for multiSelect)
- **requiresSelection**: When enabled, customers must have at least one choice selected (cannot deselect all choices). At least one choice must be marked as default when this is enabled.
- **allowQuantity**: Allow customers to specify quantity for each choice (e.g., "2x Extra Cheese")
- **minQuantity** / **maxQuantity**: Min/max quantity allowed per choice

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
model Option {
  id                String   @id
  restaurantId      String
  categoryId        String
  name              String
  description       String?
  image             String?
  choices           Choice[]
  multiSelect       Boolean  @default(false)
  minSelections     Int      @default(1)
  maxSelections     Int      @default(1)
  requiresSelection Boolean  @default(false) 
  allowQuantity     Boolean  @default(false)
  minQuantity       Int      @default(0)
  maxQuantity       Int      @default(1)
  isAvailable       Boolean  @default(true)
  isVisible         Boolean  @default(true)
}

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

## Validation and Business Rules

### Required Modifier Validation

The system enforces strict validation to ensure orders cannot be placed without required selections.

#### Frontend Validation (ItemModifierSelector)

**Prevention Logic**: Users cannot deselect choices when it would violate minimum requirements.

```typescript
// In ItemModifierSelector.tsx - handleMultiSelect
if (isSelected) {
  const isRequired = appliedOption.required || option.requiresSelection;
  const wouldViolateMinimum = isRequired && selectedForOption.length <= option.minSelections;

  if (wouldViolateMinimum) {
    return; // Silently prevent deselection
  }

  // Allow deselection
  onOptionsChange(newOptions);
}
```

**Behavior**:
- **Single-select required**: Cannot uncheck the selected choice (at least one must remain selected)
- **Multi-select with minSelections**: Cannot deselect when it would go below minimum
- **Visual feedback**: Required options show red asterisk (*), optional show "(Optional)"

#### Backend Validation (Order Creation/Editing)

**Submit Validation**: Before creating or updating an order, the system validates all modifiers.

```typescript
// In OrderModal.tsx and OrderInHouseModal.tsx
for (const item of validItems) {
  const itemRules = menuRules.find(rule => rule.menuItemId === item.menuItemId);

  if (itemRules?.appliedOptions) {
    for (const appliedOption of itemRules.appliedOptions) {
      const option = options.find(opt => opt.id === appliedOption.optionId);
      const isRequired = appliedOption.required || option.requiresSelection;

      if (isRequired) {
        const minRequired = option.multiSelect ? option.minSelections : 1;
        const selectedCount = item.selectedModifiers.filter(
          sm => sm.optionId === option.id
        ).length;

        if (selectedCount < minRequired) {
          // Show error with item name and option name
          showToast('error', `${itemName}: Please select at least ${minRequired} option(s) for "${option.name}"`);
          return; // Prevent submission
        }
      }
    }
  }
}
```

**Error Messages**:
- Single-select: `"Burger: Please select an option for 'Size'"`
- Multi-select: `"Pizza: Please select at least 2 options for 'Toppings'"`

### Multi-Select Behavior

When `multiSelect` is enabled, options behave differently:

**Configuration**:
- `minSelections`: Minimum choices required (e.g., "Select at least 2 toppings")
- `maxSelections`: Maximum choices allowed (e.g., "Select up to 4 toppings")
- `requiresSelection`: If true, minimum is enforced; if false, all selections are optional

**Examples**:

1. **Optional Multi-Select**:
   ```
   Option: Extra Toppings
   multiSelect: true
   minSelections: 0
   maxSelections: 5
   requiresSelection: false
   ```
   - Customer can select 0 to 5 toppings
   - All selections are optional

2. **Required Multi-Select**:
   ```
   Option: Pizza Toppings
   multiSelect: true
   minSelections: 2
   maxSelections: 4
   requiresSelection: true
   ```
   - Customer MUST select at least 2 toppings
   - Can select up to 4 toppings
   - Cannot proceed without meeting minimum

3. **Fixed Multi-Select**:
   ```
   Option: Build Your Bowl (Choose 3)
   multiSelect: true
   minSelections: 3
   maxSelections: 3
   requiresSelection: true
   ```
   - Customer must select exactly 3 items
   - Cannot select fewer or more

**UI Indicators**:
- Shows "Min X, Max Y" next to option name
- Displays warning text when below minimum: "Please select at least X options"
- Prevents selection when maximum reached
- Red asterisk (*) for required options

### Applied Option Configuration

When attaching an option to a menu item via MenuRules, you can set:

**required** (boolean):
- Independent of `requiresSelection` on the Option
- Applied at the menu item level
- Example: Size might not be globally required, but required for Pizza
- When `true`, acts as if `requiresSelection` is enabled for this specific item

**Validation Priority**:
```typescript
const isRequired = appliedOption.required || option.requiresSelection;
```
Either field being `true` makes the modifier required.

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

KitchenPage / OrdersPage
  └─ OrderModal (Create/Edit orders)
      └─ ItemModifierSelector (For each item)
          └─ Choice selection UI with validation

```

### ItemModifierSelector Component

**Purpose**: Displays and handles modifier selection during order creation/editing.

**Features**:
- Visual distinction between required (*) and optional modifiers
- Real-time validation feedback
- Prevents invalid deselections
- Shows min/max selection requirements
- Supports quantity adjustment for choices
- Displays price adjustments dynamically

**Props**:
```typescript
interface ItemModifierSelectorProps {
  itemRules: {
    appliedOptions: AppliedOption[];
  };
  options: Option[];
  selectedOptions: SelectedChoice[];
  onOptionsChange: (options: SelectedChoice[]) => void;
  currencySymbol: string;
}
```

**Selection Flow**:
1. **Single-select options**:
   - Radio button behavior
   - Clicking another choice switches selection
   - Cannot deselect if required

2. **Multi-select options**:
   - Checkbox behavior
   - Can select multiple up to `maxSelections`
   - Cannot deselect below `minSelections` if required
   - Shows count: "Selected X of Y"

**Visual States**:
- **Selected**: Blue background, checkmark icon
- **Disabled**: Grayed out when max reached or unavailable
- **Required**: Red asterisk next to option name
- **Optional**: "(Optional)" text next to option name

### OrderModal Component

**Purpose**: Universal modal for creating and editing in-house orders.

**Features**:
- Create mode: Empty form
- Edit mode: Pre-filled with existing order data
- Validates all modifiers before submission
- Reconstructs modifier selections from saved orders
- Supports multiple items per order
- Real-time total calculation with tax preview

**Key Functions**:

1. **Pre-filling for Edit**:
```typescript
useEffect(() => {
  if (existingOrder && options.length > 0) {
    // Match saved options back to current menu options by name
    const selectedModifiers = (item.options || []).map(orderOption => {
      const matchingOption = options.find(opt => opt.name === orderOption.name);
      const matchingChoice = matchingOption?.choices.find(
        choice => choice.name === orderOption.choice
      );

      return {
        optionId: matchingOption?.id || '',
        optionName: orderOption.name,
        choiceId: matchingChoice?.id || '',
        choiceName: orderOption.choice,
        quantity: 1,
        priceAdjustment: orderOption.priceAdjustment,
      };
    });
    // Set items with reconstructed modifiers
  }
}, [existingOrder, isOpen, options]);
```

2. **Validation Before Submit**:
```typescript
// For each item and each applied option
const isRequired = appliedOption.required || option.requiresSelection;
const minRequired = option.multiSelect ? option.minSelections : 1;

if (isRequired && selectedCount < minRequired) {
  showToast('error', `${itemName}: Please select...`);
  return; // Prevent submission
}
```

**Usage**:
- Kitchen page: Create in-house orders
- Orders page: Edit existing orders
- Shared component ensures consistent behavior

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

### 8. **Use "Requires Selection" Wisely**

- Enable for critical modifiers where a choice is mandatory (e.g., Size, Temperature)
- When enabled, at least one choice must be set as default
- Prevents customers from accidentally placing orders without required selections
- Don't overuse - only for truly mandatory modifiers

### 9. **Multi-Select Configuration**

- Set appropriate `minSelections` and `maxSelections` based on business needs
- `minSelections = 0` with `requiresSelection = false` makes all choices optional
- `minSelections > 0` with `requiresSelection = true` enforces minimum selection
- Use equal min/max values for "choose exactly X" scenarios (e.g., "Choose 3 proteins")

### 10. **Validation is Two-Layered**

- **UI Prevention**: ItemModifierSelector prevents invalid interactions
- **Backend Validation**: Server actions validate before saving to database
- Never rely solely on UI validation - always validate server-side
- Both layers use the same logic: `isRequired = appliedOption.required || option.requiresSelection`

---

## Implementation Examples

### Example 1: Required Size Selection

**Scenario**: Every pizza must have a size selected.

**Setup**:
```typescript
// Option configuration
{
  name: "Size",
  multiSelect: false,
  minSelections: 1,
  maxSelections: 1,
  requiresSelection: true,  // Required globally
  choices: [
    { name: "Small", basePrice: 0, isDefault: true },  // Default choice
    { name: "Medium", basePrice: 5 },
    { name: "Large", basePrice: 10 }
  ]
}

// Applied to menu item
{
  optionId: "size-option-id",
  required: true,  // Also marked required at item level
  order: 0,
  choiceAdjustments: [...]
}
```

**Behavior**:
- UI shows red asterisk next to "Size"
- One choice (Small) is pre-selected by default
- User cannot uncheck the selected size
- Attempting to save without a size shows: "Pizza: Please select an option for 'Size'"

### Example 2: Multi-Select Toppings

**Scenario**: Customer must choose at least 2 toppings, up to 4.

**Setup**:
```typescript
// Option configuration
{
  name: "Toppings",
  multiSelect: true,
  minSelections: 2,
  maxSelections: 4,
  requiresSelection: true,
  choices: [
    { name: "Cheese", basePrice: 2, isDefault: true },
    { name: "Pepperoni", basePrice: 3, isDefault: true },
    { name: "Mushrooms", basePrice: 2 },
    { name: "Olives", basePrice: 2 },
    { name: "Peppers", basePrice: 2 }
  ]
}
```

**Behavior**:
- UI shows "Min 2, Max 4" next to "Toppings"
- Two choices are pre-selected by default
- User can select up to 4 total
- Cannot deselect when only 2 are selected (would violate minimum)
- Attempting to save with only 1 shows: "Pizza: Please select at least 2 options for 'Toppings'"
- Cannot select a 5th topping (max reached)

### Example 3: Optional Add-ons

**Scenario**: Customer can optionally add extras, but none are required.

**Setup**:
```typescript
// Option configuration
{
  name: "Extra Add-ons",
  multiSelect: true,
  minSelections: 0,
  maxSelections: 3,
  requiresSelection: false,  // Not required
  choices: [
    { name: "Extra Cheese", basePrice: 2 },
    { name: "Garlic Bread", basePrice: 3 },
    { name: "Dipping Sauce", basePrice: 1 }
  ]
}

// Applied to menu item
{
  optionId: "extras-option-id",
  required: false,  // Optional at item level too
  order: 2,
  choiceAdjustments: [...]
}
```

**Behavior**:
- UI shows "(Optional)" next to "Extra Add-ons"
- No choices are pre-selected
- User can select 0 to 3 extras
- Can freely check/uncheck any choice
- No validation error if none selected

### Example 4: Fixed Choice Selection

**Scenario**: Build-your-own bowl - must choose exactly 3 proteins.

**Setup**:
```typescript
// Option configuration
{
  name: "Choose Your Proteins (Select 3)",
  multiSelect: true,
  minSelections: 3,
  maxSelections: 3,
  requiresSelection: true,
  choices: [
    { name: "Chicken", basePrice: 0 },
    { name: "Beef", basePrice: 0 },
    { name: "Shrimp", basePrice: 2 },
    { name: "Tofu", basePrice: 0 },
    { name: "Salmon", basePrice: 3 }
  ]
}
```

**Behavior**:
- UI shows "Min 3, Max 3" (exactly 3 required)
- User must select exactly 3 proteins
- After selecting 3, cannot select a 4th
- Cannot deselect when exactly 3 are selected
- Warning shows: "Please select at least 3 options" until requirement met

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

### Issue: Can't Deselect a Choice

**Cause**: The option is required and deselecting would violate minimum selections

**Solution**:
- This is intentional validation behavior
- For single-select required options, at least one must stay selected
- For multi-select, must maintain minimum selection count
- To make deselection possible, either:
  - Set `requiresSelection = false` on the Option
  - Set `required = false` on the AppliedOption
  - Increase minimum selections threshold

### Issue: Order Won't Save

**Cause**: Required modifiers aren't selected

**Solution**:
- Check error message - it will specify which item and which option
- Ensure all required modifiers have minimum selections met
- For multi-select, verify `minSelections` count is reached
- Check that all items in the order have their requirements satisfied

### Issue: Modifiers Not Showing When Editing

**Cause**: Saved modifiers don't match current menu options

**Solution**:
- System matches saved modifiers by name (not ID)
- If an option or choice was renamed/deleted, it won't match
- Saved data shows original names but may not have valid IDs
- User can manually reselect the correct updated options

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
