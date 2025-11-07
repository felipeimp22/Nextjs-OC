# Menu System with Complex Modifiers Guide

## Table of Contents
1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [Modifier System](#modifier-system)
4. [Price Adjustment Types](#price-adjustment-types)
5. [Real-World Examples](#real-world-examples)
6. [API Usage](#api-usage)
7. [Frontend Integration](#frontend-integration)

---

## Overview

The menu system supports **reusable modifiers** with **complex price adjustments** including:

- ✅ Base modifier prices
- ✅ Item-specific price overrides
- ✅ Cross-option price relationships
- ✅ Multipliers, additions, and fixed prices
- ✅ Quantity-based pricing

### Key Concepts

**Menu Items**: Products (e.g., Pizza, Burger)
**Options**: Reusable modifier groups (e.g., Size, Toppings)
**Choices**: Individual selections within an option (e.g., Small, Medium, Large)
**Menu Rules**: Item-specific configurations for options
**Price Adjustments**: How option selections affect final price

---

## Database Structure

```
MenuItem
  ├── MenuRules
  │   └── AppliedOptions[]
  │       └── ChoiceAdjustments[]
  │           └── PriceAdjustments[] (Cross-option rules)
  │
  └── Base price

Option (Reusable)
  └── Choices[]
      └── Base price
```

### Models

#### MenuItem

```prisma
model MenuItem {
  id String @id
  name String
  price Float // Base price
  category MenuCategory
  rules MenuRules? // Item-specific option config
}
```

#### Option (Reusable Modifier)

```prisma
model Option {
  id String @id
  name String // e.g., "Size"
  choices Choice[] // e.g., [Small, Medium, Large]
  multiSelect Boolean
  minSelections Int
  maxSelections Int
}

type Choice {
  id String
  name String
  basePrice Float // Default price for this choice
  isDefault Boolean
}
```

#### MenuRules (Item-Option Relationship)

```prisma
model MenuRules {
  id String @id
  menuItemId String @unique
  appliedOptions AppliedOption[]
}

type AppliedOption {
  optionId String // References Option
  required Boolean
  order Int
  choiceAdjustments ChoiceAdjustment[] // Item-specific overrides
}

type ChoiceAdjustment {
  choiceId String // References Choice within Option
  priceAdjustment Float // Override/addition to base price
  isAvailable Boolean
  isDefault Boolean
  adjustments PriceAdjustment[] // Cross-option rules
}

type PriceAdjustment {
  targetOptionId String // Which option to affect
  targetChoiceId String? // Optional: specific choice
  adjustmentType String // "multiplier", "addition", "fixed"
  value Float // The adjustment value
}
```

---

## Modifier System

### How Prices Are Calculated

```
Final Item Price = Base Price + Direct Adjustments + Cross-Option Adjustments
```

#### Step 1: Direct Option Pricing

For each selected option:
```
Option Price = (Choice Base Price + Item-Specific Adjustment) × Quantity
```

#### Step 2: Self-Adjustments

Apply adjustments that don't target other options:
- **Multiplier**: `Option Price × Value`
- **Addition**: `Option Price + Value`
- **Fixed**: Replace with fixed value

#### Step 3: Cross-Option Adjustments

Apply adjustments based on other selected options:
```
If (Target Option Selected) {
  Apply adjustment to current option price
}
```

---

## Price Adjustment Types

### 1. Multiplier

**Use Case**: "Large size makes toppings cost 1.5× more"

```typescript
{
  targetOptionId: "size_option_id",
  targetChoiceId: "large_choice_id",
  adjustmentType: "multiplier",
  value: 1.5
}
```

**Calculation:**
```
Topping base price: $2.00
Large size selected → Multiply by 1.5
Final topping price: $2.00 × 1.5 = $3.00
```

### 2. Addition

**Use Case**: "Large size adds $1 to each topping"

```typescript
{
  targetOptionId: "size_option_id",
  targetChoiceId: "large_choice_id",
  adjustmentType: "addition",
  value: 1.00
}
```

**Calculation:**
```
Topping base price: $2.00
Large size selected → Add $1.00
Final topping price: $2.00 + $1.00 = $3.00
```

### 3. Fixed

**Use Case**: "Premium cheese costs exactly $5 with large size"

```typescript
{
  targetOptionId: "size_option_id",
  targetChoiceId: "large_choice_id",
  adjustmentType: "fixed",
  value: 5.00
}
```

**Calculation:**
```
Cheese base price: $2.50
Large size selected → Replace with $5.00
Final cheese price: $5.00
```

---

## Real-World Examples

### Example 1: Pizza Size & Toppings

**Scenario:**
- Base Pizza: $12
- Size Options: Small (+$0), Medium (+$3), Large (+$5)
- Toppings: Pepperoni ($2), Mushrooms ($1.50), Extra Cheese ($2)
- **Rule**: Large size makes all toppings cost 1.5× more

#### Database Setup

```json
// MenuItem
{
  "id": "pizza_margherita",
  "name": "Margherita Pizza",
  "price": 12.00
}

// Option: Size
{
  "id": "pizza_size",
  "name": "Size",
  "choices": [
    { "id": "small", "name": "Small (10\")", "basePrice": 0 },
    { "id": "medium", "name": "Medium (12\")", "basePrice": 0 },
    { "id": "large", "name": "Large (14\")", "basePrice": 0 }
  ]
}

// Option: Toppings
{
  "id": "pizza_toppings",
  "name": "Toppings",
  "choices": [
    { "id": "pepperoni", "name": "Pepperoni", "basePrice": 2.00 },
    { "id": "mushrooms", "name": "Mushrooms", "basePrice": 1.50 },
    { "id": "extra_cheese", "name": "Extra Cheese", "basePrice": 2.00 }
  ],
  "multiSelect": true,
  "maxSelections": 5
}

// MenuRules for pizza_margherita
{
  "menuItemId": "pizza_margherita",
  "appliedOptions": [
    {
      "optionId": "pizza_size",
      "required": true,
      "order": 1,
      "choiceAdjustments": [
        {
          "choiceId": "small",
          "priceAdjustment": 0,
          "isDefault": true
        },
        {
          "choiceId": "medium",
          "priceAdjustment": 3.00
        },
        {
          "choiceId": "large",
          "priceAdjustment": 5.00
        }
      ]
    },
    {
      "optionId": "pizza_toppings",
      "required": false,
      "order": 2,
      "choiceAdjustments": [
        {
          "choiceId": "pepperoni",
          "priceAdjustment": 0, // Use base price from option
          "adjustments": [
            {
              "targetOptionId": "pizza_size",
              "targetChoiceId": "large",
              "adjustmentType": "multiplier",
              "value": 1.5
            }
          ]
        },
        {
          "choiceId": "mushrooms",
          "priceAdjustment": 0,
          "adjustments": [
            {
              "targetOptionId": "pizza_size",
              "targetChoiceId": "large",
              "adjustmentType": "multiplier",
              "value": 1.5
            }
          ]
        },
        {
          "choiceId": "extra_cheese",
          "priceAdjustment": 0,
          "adjustments": [
            {
              "targetOptionId": "pizza_size",
              "targetChoiceId": "large",
              "adjustmentType": "multiplier",
              "value": 1.5
            }
          ]
        }
      ]
    }
  ]
}
```

#### Order Calculation

**Customer Orders:**
- Large Pizza
- Pepperoni
- Extra Cheese

**Calculation:**
```
Base Price:       $12.00
Large Size:       + $5.00

Pepperoni:        $2.00 × 1.5 (large multiplier) = $3.00
Extra Cheese:     $2.00 × 1.5 (large multiplier) = $3.00

Total: $12.00 + $5.00 + $3.00 + $3.00 = $23.00
```

### Example 2: Coffee with Size & Add-ons

**Scenario:**
- Base Coffee: $3
- Size: Regular (+$0), Large (+$1)
- Add-ons: Extra Shot ($1.50), Whipped Cream ($0.50)
- **Rule**: Large size adds $0.50 to each add-on

```json
// MenuRules for coffee
{
  "menuItemId": "latte",
  "appliedOptions": [
    {
      "optionId": "coffee_size",
      "choiceAdjustments": [
        { "choiceId": "regular", "priceAdjustment": 0 },
        { "choiceId": "large", "priceAdjustment": 1.00 }
      ]
    },
    {
      "optionId": "coffee_addons",
      "choiceAdjustments": [
        {
          "choiceId": "extra_shot",
          "priceAdjustment": 0, // Use base $1.50
          "adjustments": [
            {
              "targetOptionId": "coffee_size",
              "targetChoiceId": "large",
              "adjustmentType": "addition",
              "value": 0.50
            }
          ]
        },
        {
          "choiceId": "whipped_cream",
          "priceAdjustment": 0, // Use base $0.50
          "adjustments": [
            {
              "targetOptionId": "coffee_size",
              "targetChoiceId": "large",
              "adjustmentType": "addition",
              "value": 0.50
            }
          ]
        }
      ]
    }
  ]
}
```

**Order: Large Latte + Extra Shot**
```
Base:         $3.00
Large:        + $1.00
Extra Shot:   $1.50 + $0.50 (large addition) = $2.00

Total: $3.00 + $1.00 + $2.00 = $6.00
```

### Example 3: Burger with Premium Options

**Scenario:**
- Base Burger: $8
- Protein: Beef (+$0), Chicken (+$2), Beyond Burger (+$4)
- Cheese: Regular (+$0.50), Premium (+$2)
- **Rule**: Premium cheese with Beyond Burger costs fixed $3 (instead of $2)

```json
{
  "appliedOptions": [
    {
      "optionId": "protein",
      "choiceAdjustments": [
        { "choiceId": "beef", "priceAdjustment": 0 },
        { "choiceId": "chicken", "priceAdjustment": 2.00 },
        { "choiceId": "beyond", "priceAdjustment": 4.00 }
      ]
    },
    {
      "optionId": "cheese",
      "choiceAdjustments": [
        {
          "choiceId": "premium_cheese",
          "priceAdjustment": 2.00,
          "adjustments": [
            {
              "targetOptionId": "protein",
              "targetChoiceId": "beyond",
              "adjustmentType": "fixed",
              "value": 3.00
            }
          ]
        }
      ]
    }
  ]
}
```

**Order 1: Beef Burger + Premium Cheese**
```
Base:             $8.00
Beef:             $0
Premium Cheese:   $2.00

Total: $10.00
```

**Order 2: Beyond Burger + Premium Cheese**
```
Base:             $8.00
Beyond:           $4.00
Premium Cheese:   $3.00 (fixed price when Beyond selected)

Total: $15.00
```

---

## API Usage

### Fetching Menu Data

```typescript
// GET /api/menu/items?restaurantId=xxx&categoryId=yyy

const response = await fetch('/api/menu/items?restaurantId=123');
const items = await response.json();

// Returns:
{
  "data": [
    {
      "id": "pizza_margherita",
      "name": "Margherita Pizza",
      "price": 12.00,
      "rules": {
        "appliedOptions": [/* ... */]
      }
    }
  ]
}
```

### Calculating Order Draft

```typescript
// POST /api/orders/draft

const response = await fetch('/api/orders/draft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    restaurantId: '123',
    items: [
      {
        menuItemId: 'pizza_margherita',
        quantity: 1,
        selectedOptions: [
          { optionId: 'pizza_size', choiceId: 'large' },
          { optionId: 'pizza_toppings', choiceId: 'pepperoni' },
          { optionId: 'pizza_toppings', choiceId: 'extra_cheese' },
        ],
      },
    ],
    orderType: 'delivery',
    tip: 5.00,
  }),
});

const draft = await response.json();

// Returns:
{
  "data": {
    "items": [
      {
        "name": "Margherita Pizza",
        "finalPrice": 23.00,
        "options": [
          { "name": "Size", "choice": "Large (14\")", "priceAdjustment": 5.00 },
          { "name": "Toppings", "choice": "Pepperoni", "priceAdjustment": 3.00 },
          { "name": "Toppings", "choice": "Extra Cheese", "priceAdjustment": 3.00 }
        ]
      }
    ],
    "subtotal": 23.00,
    "tax": 2.19,
    "deliveryFee": 8.00,
    "tip": 5.00,
    "platformFee": 1.95,
    "total": 40.14
  }
}
```

---

## Frontend Integration

### Shopping Cart Component

```tsx
'use client';

import { useState, useEffect } from 'react';

interface SelectedOption {
  optionId: string;
  choiceId: string;
  optionName: string;
  choiceName: string;
  priceAdjustment: number;
}

export default function ShoppingCart() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(null);

  // Calculate draft whenever cart changes
  useEffect(() => {
    if (items.length > 0) {
      calculateDraft();
    }
  }, [items]);

  const calculateDraft = async () => {
    const response = await fetch('/api/orders/draft', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId: '...',
        items,
        orderType: 'delivery',
      }),
    });

    const data = await response.json();
    setDraft(data.data);
  };

  const addItem = (menuItem, selectedOptions: SelectedOption[]) => {
    setItems(prev => [
      ...prev,
      {
        menuItemId: menuItem.id,
        quantity: 1,
        selectedOptions: selectedOptions.map(opt => ({
          optionId: opt.optionId,
          choiceId: opt.choiceId,
        })),
      },
    ]);
  };

  return (
    <div className="shopping-cart">
      <h2>Cart</h2>

      {items.map((item, index) => (
        <div key={index} className="cart-item">
          <h3>{item.name}</h3>
          {item.selectedOptions?.map((opt, i) => (
            <div key={i}>
              {opt.optionName}: {opt.choiceName}
              {opt.priceAdjustment > 0 && ` (+$${opt.priceAdjustment.toFixed(2)})`}
            </div>
          ))}
        </div>
      ))}

      {draft && (
        <div className="cart-summary">
          <div>Subtotal: ${draft.subtotal.toFixed(2)}</div>
          <div>Tax: ${draft.tax.toFixed(2)}</div>
          <div>Delivery: ${draft.deliveryFee.toFixed(2)}</div>
          <div>Platform Fee: ${draft.platformFee.toFixed(2)}</div>
          <div className="total">Total: ${draft.total.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
```

### Menu Item Configurator

```tsx
interface MenuItemConfiguratorProps {
  menuItem: MenuItem;
  options: Option[];
  menuRules: MenuRules;
  onAdd: (item, selectedOptions) => void;
}

export function MenuItemConfigurator({
  menuItem,
  options,
  menuRules,
  onAdd,
}: MenuItemConfiguratorProps) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(menuItem.price);

  useEffect(() => {
    // Recalculate price when selections change
    calculatePrice();
  }, [selectedOptions]);

  const calculatePrice = () => {
    // Use orderDraftCalculator or simplified calculation
    // This is where the complex price logic runs client-side
    // for real-time feedback
  };

  const handleOptionSelect = (optionId, choiceId) => {
    // Update selections
    // Trigger price recalculation
  };

  return (
    <div className="configurator">
      <h2>{menuItem.name}</h2>
      <p className="base-price">Base: ${menuItem.price.toFixed(2)}</p>

      {menuRules.appliedOptions.map(appliedOption => {
        const option = options.find(o => o.id === appliedOption.optionId);

        return (
          <div key={appliedOption.optionId} className="option-group">
            <h3>
              {option.name}
              {appliedOption.required && <span className="required">*</span>}
            </h3>

            {option.choices.map(choice => (
              <label key={choice.id} className="choice">
                <input
                  type={option.multiSelect ? 'checkbox' : 'radio'}
                  name={option.id}
                  value={choice.id}
                  onChange={() => handleOptionSelect(option.id, choice.id)}
                />
                <span>{choice.name}</span>
                <span className="price">
                  {choice.basePrice > 0 && `+$${choice.basePrice.toFixed(2)}`}
                </span>
              </label>
            ))}
          </div>
        );
      })}

      <div className="calculated-price">
        <strong>Total: ${calculatedPrice.toFixed(2)}</strong>
      </div>

      <button onClick={() => onAdd(menuItem, selectedOptions)}>
        Add to Cart
      </button>
    </div>
  );
}
```

---

## Best Practices

### 1. Option Reusability

Create generic options that can be reused across items:
```
✅ "Size" option → Used for pizzas, drinks, desserts
✅ "Spice Level" option → Used for all spicy dishes
❌ "Pizza Size" option → Too specific, not reusable
```

### 2. Price Adjustment Hierarchy

1. **Fixed Price** (highest priority)
2. **Multipliers**
3. **Additions**
4. **Base Prices** (lowest priority)

### 3. Testing Price Logic

Always test these scenarios:
- Single option selection
- Multiple options with no cross-adjustments
- Cross-option multipliers
- Cross-option additions
- Cross-option fixed prices
- Quantity × price adjustments

### 4. User Experience

- Show real-time price updates
- Clearly display option effects (e.g., "×1.5" indicator)
- Highlight default selections
- Indicate required vs optional options

---

## Troubleshooting

### Price Calculation Issues

**Problem**: Prices don't match expected values

**Debug Steps:**
1. Check `orderDraftCalculator.ts` logs
2. Verify `menuRules` are correctly configured
3. Ensure `targetOptionId` references match
4. Test adjustment types individually

### Cross-Option Adjustments Not Working

**Checklist:**
- ✅ `targetOptionId` is correct
- ✅ `targetChoiceId` matches (or is null for all choices)
- ✅ Both options are in `selectedOptions`
- ✅ Adjustment type is spelled correctly

---

## Summary

The menu system provides:
- **Flexibility**: Handle any pricing scenario
- **Reusability**: Define options once, use everywhere
- **Consistency**: Centralized calculation logic
- **Real-time**: Instant price feedback

For support, refer to:
- [Settings System Guide](./SETTINGS_SYSTEM_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
