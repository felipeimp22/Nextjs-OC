# Restaurant Manager Settings System Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Provider Patterns](#provider-patterns)
5. [Utility Services](#utility-services)
6. [Order Calculation Flow](#order-calculation-flow)
7. [API Routes Guide](#api-routes-guide)
8. [Frontend Implementation](#frontend-implementation)
9. [Environment Configuration](#environment-configuration)

---

## Overview

This settings system provides a comprehensive, scalable solution for managing restaurant operations including:

- **Financial Settings**: Payment providers (Stripe, MercadoPago), taxes, tips, platform fees
- **Delivery Settings**: Multiple delivery providers, distance-based pricing
- **Store Hours**: Regular hours, special closures, holiday configuration
- **User Roles**: Granular permissions system
- **Menu Management**: Complex modifiers with cross-option price adjustments

### Key Features

✅ **Provider Pattern**: Easily swap payment & delivery providers
✅ **Distance-Based Pricing**: Configurable tiers for delivery fees
✅ **Centralized Tax Calculation**: Support percentage & fixed taxes
✅ **Order Draft Calculator**: Real-time price preview
✅ **Strategic Logging**: Debug-friendly error tracking

---

## Architecture

```
lib/
├── payment/                      # Payment provider system
│   ├── interfaces/
│   │   └── IPaymentProvider.ts
│   ├── providers/
│   │   ├── StripePaymentProvider.ts
│   │   └── MercadoPagoPaymentProvider.ts
│   ├── PaymentFactory.ts
│   └── index.ts
│
├── delivery/                     # Delivery provider system
│   ├── interfaces/
│   │   └── IDeliveryProvider.ts
│   ├── providers/
│   │   └── ShipdayDeliveryProvider.ts
│   ├── DeliveryFactory.ts
│   └── index.ts
│
└── utils/                        # Calculation utilities
    ├── distance.ts               # Distance & delivery fee calculations
    ├── taxCalculator.ts          # Centralized tax calculation
    └── orderDraftCalculator.ts   # Order price preview

prisma/
├── settings.prisma               # Settings schemas
└── menu.prisma                   # Menu & modifiers schemas
```

---

## Database Schema

### Financial Settings

```prisma
model FinancialSettings {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  restaurantId String @unique @db.ObjectId

  currency String @default("USD")
  currencySymbol String @default("$")

  // Customizable taxes
  taxes TaxSetting[]

  // Tips
  tipsEnabled Boolean @default(true)
  defaultTipOptions Float[] @default([15, 18, 20])

  // Payment Provider
  paymentProvider String @default("stripe")
  stripeEnabled Boolean @default(false)
  stripeAccountId String?
  // ... more fields
}

type TaxSetting {
  name String
  enabled Boolean
  rate Float
  type String // "percentage" | "fixed"
  applyTo String // "entire_order" | "per_item"
}
```

### Delivery Settings with Distance-Based Pricing

```prisma
model DeliverySettings {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  restaurantId String @unique @db.ObjectId

  enabled Boolean @default(true)
  distanceUnit String @default("miles") // "miles" | "km"
  maximumRadius Float @default(10)

  // NEW: Distance-based pricing tiers
  pricingTiers DeliveryPricingTier[]

  // Driver provider
  driverProvider String @default("shipday")
  provideDriver Boolean @default(true)
}

type DeliveryPricingTier {
  name String @default("Default")
  distanceCovered Float // e.g., 10 miles
  baseFee Float // e.g., $10 for first 10 miles
  additionalFeePerUnit Float // e.g., $2 per mile after 10 miles
  isDefault Boolean @default(false)
}
```

**Example Configuration:**

```javascript
pricingTiers: [
  {
    name: "City Zone",
    distanceCovered: 5,      // First 5 miles
    baseFee: 5.00,           // $5 base fee
    additionalFeePerUnit: 1.50, // +$1.50/mile after 5 miles
    isDefault: true
  },
  {
    name: "Extended Zone",
    distanceCovered: 15,     // First 15 miles
    baseFee: 12.00,          // $12 base fee
    additionalFeePerUnit: 2.00, // +$2/mile after 15 miles
    isDefault: false
  }
]
```

**Delivery Fee Calculation:**
- Distance: 7 miles
- Uses "City Zone" tier
- Calculation: $5 (base) + (7 - 5) × $1.50 = $5 + $3 = **$8.00**

---

## Provider Patterns

### Payment Providers

#### Usage

```typescript
import { PaymentFactory } from '@/lib/payment';

// Get the configured provider
const paymentProvider = await PaymentFactory.getProvider();

// Create payment intent
const result = await paymentProvider.createPaymentIntent({
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  orderId: 'order_123',
  restaurantId: 'rest_456',
  platformFee: 195, // $1.95 in cents
  connectedAccountId: 'acct_xxx', // For Stripe Connect
  applicationFeeAmount: 500, // $5.00 platform fee
});

console.log(result.clientSecret); // Use for frontend
```

#### Implementing New Payment Providers

1. Create provider class implementing `IPaymentProvider`:

```typescript
// lib/payment/providers/YourProvider.ts
export class YourPaymentProvider implements IPaymentProvider {
  async initialize(config: any): Promise<void> {
    // Initialize your provider
  }

  async createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentIntentResult> {
    // Implementation
  }

  // ... implement other methods
}
```

2. Register in `PaymentFactory.ts`:

```typescript
case 'yourprovider': {
  const provider = new YourPaymentProvider();
  await provider.initialize({
    apiKey: process.env.YOUR_PROVIDER_API_KEY!,
  });
  this.instance = provider;
  break;
}
```

### Delivery Providers

#### Usage

```typescript
import { DeliveryFactory } from '@/lib/delivery';

const deliveryProvider = await DeliveryFactory.getProvider();

// Get delivery estimate
const estimate = await deliveryProvider.getEstimate({
  pickupAddress: restaurantAddress,
  deliveryAddress: customerAddress,
});

console.log(`Fee: $${estimate.fee}, ETA: ${estimate.estimatedTime} min`);

// Create delivery
const delivery = await deliveryProvider.createDelivery({
  orderId: 'order_123',
  orderNumber: '#1234',
  pickupAddress: restaurantAddress,
  deliveryAddress: customerAddress,
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  orderValue: 50.00,
});

console.log(`Tracking: ${delivery.trackingUrl}`);
```

---

## Utility Services

### Tax Calculator

```typescript
import { calculateTaxes, TaxSetting } from '@/lib/utils/taxCalculator';

const taxSettings: TaxSetting[] = [
  {
    name: 'State Tax',
    enabled: true,
    rate: 7.5,
    type: 'percentage',
    applyTo: 'entire_order',
  },
  {
    name: 'City Tax',
    enabled: true,
    rate: 2.0,
    type: 'percentage',
    applyTo: 'entire_order',
  },
  {
    name: 'Container Fee',
    enabled: true,
    rate: 0.50,
    type: 'fixed',
    applyTo: 'per_item',
  },
];

const result = calculateTaxes(
  100.00, // subtotal
  [
    { name: 'Pizza', price: 25, quantity: 2, total: 50 },
    { name: 'Pasta', price: 20, quantity: 1, total: 20 },
    { name: 'Salad', price: 15, quantity: 2, total: 30 },
  ],
  taxSettings
);

console.log(result);
// {
//   totalTax: 11.00,
//   breakdown: [
//     { name: 'State Tax', rate: 7.5, amount: 7.50, type: 'percentage' },
//     { name: 'City Tax', rate: 2.0, amount: 2.00, type: 'percentage' },
//     { name: 'Container Fee', rate: null, amount: 1.50, type: 'fixed' } // 3 items × $0.50
//   ],
//   subtotalBeforeTax: 100.00,
//   totalWithTax: 111.00
// }
```

### Distance Calculator

```typescript
import { calculateDeliveryFee, DeliveryPricingTier } from '@/lib/utils/distance';

const pricingTiers: DeliveryPricingTier[] = [
  {
    name: 'Local',
    distanceCovered: 10,
    baseFee: 10.00,
    additionalFeePerUnit: 2.00,
    isDefault: true,
  },
];

const result = calculateDeliveryFee(
  13.5, // distance in miles
  pricingTiers,
  'miles'
);

console.log(result);
// {
//   baseFee: 10.00,
//   distanceFee: 7.00, // (13.5 - 10) × $2.00
//   totalFee: 17.00,
//   distance: 13.5,
//   distanceUnit: 'miles',
//   tierUsed: 'Local'
// }
```

---

## Order Calculation Flow

### Menu System with Complex Modifiers

#### Example: Pizza with Size and Toppings

```typescript
// Menu Item: Large Pizza - $15.00 base

// Options:
// 1. Size: Small ($0), Medium (+$3), Large (+$5)
// 2. Toppings: Pepperoni (+$2), Mushrooms (+$1.50), Extra Cheese (+$2)

// Rule: If Large size is selected, topping prices are multiplied by 1.5

// Menu Rules:
{
  menuItemId: "pizza_123",
  appliedOptions: [
    {
      optionId: "size_opt",
      choiceAdjustments: [
        {
          choiceId: "large_choice",
          priceAdjustment: 5.00,
        }
      ]
    },
    {
      optionId: "toppings_opt",
      choiceAdjustments: [
        {
          choiceId: "pepperoni_choice",
          priceAdjustment: 2.00,
          adjustments: [
            {
              targetOptionId: "size_opt",
              targetChoiceId: "large_choice",
              adjustmentType: "multiplier",
              value: 1.5
            }
          ]
        }
      ]
    }
  ]
}
```

**Order Calculation:**

```typescript
// Customer orders: Large Pizza + Pepperoni

// Step 1: Base Price
basePrice = $15.00

// Step 2: Size adjustment
size = "Large" → +$5.00

// Step 3: Topping adjustment
pepperoni = $2.00

// Step 4: Cross-option adjustment (Large × Pepperoni)
// Pepperoni price multiplied by 1.5 when Large is selected
pepperoni_adjusted = $2.00 × 1.5 = $3.00

// Final calculation:
total = $15.00 (base) + $5.00 (large) + $3.00 (pepperoni) = $23.00
```

### Order Draft Calculator

```typescript
import { calculateOrderDraft } from '@/lib/utils/orderDraftCalculator';

const result = await calculateOrderDraft(
  {
    restaurantId: 'rest_123',
    items: [
      {
        menuItemId: 'pizza_123',
        quantity: 1,
        selectedOptions: [
          { optionId: 'size_opt', choiceId: 'large_choice' },
          { optionId: 'toppings_opt', choiceId: 'pepperoni_choice' },
        ],
      },
    ],
    orderType: 'delivery',
    tip: 5.00,
    taxSettings: taxSettings,
    deliveryPricingTiers: pricingTiers,
    restaurantLocation: { lat: 40.7128, lng: -74.0060 },
    customerLocation: { lat: 40.7580, lng: -73.9855 },
    globalFee: {
      enabled: true,
      threshold: 10.00,
      belowPercent: 10,
      aboveFlat: 1.95,
    },
  },
  menuItemsMap,
  menuRulesMap,
  optionsMap
);

console.log(result);
// {
//   items: [/* calculated items */],
//   subtotal: 23.00,
//   tax: 2.19, // 9.5% state + city tax
//   taxBreakdown: [/* breakdown */],
//   deliveryFee: 8.00,
//   tip: 5.00,
//   platformFee: 1.95,
//   total: 40.14
// }
```

---

## Server Actions Guide

The application uses Next.js Server Actions for all data operations, providing better performance and type safety than traditional API routes.

### Example: Financial Settings Server Action

```typescript
// lib/serverActions/settings.actions.ts

'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getFinancialSettings(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const settings = await prisma.financialSettings.findUnique({
      where: { restaurantId },
    });

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error fetching financial settings:', error);
    return { success: false, error: 'Failed to fetch settings', data: null };
  }
}

export async function updateFinancialSettings(restaurantId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Verify user has access to this restaurant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: {
            restaurantId,
            role: { in: ['owner', 'manager'] }
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const settings = await prisma.financialSettings.upsert({
      where: { restaurantId },
      update: data,
      create: {
        restaurantId,
        ...data,
      },
    });

    revalidatePath(`/${restaurantId}/settings`);
    revalidatePath(`/${restaurantId}/settings/financial`);

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error updating financial settings:', error);
    return { success: false, error: 'Failed to save settings', data: null };
  }
}
```

### Using Server Actions in Components

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getFinancialSettings, updateFinancialSettings } from '@/lib/serverActions/settings.actions';
import { toast } from 'sonner';

export default function FinancialSettingsPage({ params }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [params.id]);

  const loadSettings = async () => {
    const result = await getFinancialSettings(params.id);
    if (result.success) {
      setSettings(result.data);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    const result = await updateFinancialSettings(params.id, data);
    if (result.success) {
      toast.success('Settings saved successfully');
      setSettings(result.data);
    } else {
      toast.error(result.error);
    }
  };

  // ... component JSX
}
```

---

## Frontend Implementation

### Example: Settings Page

```tsx
// app/[locale]/(private)/dashboard/[restaurantId]/settings/financial/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function FinancialSettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.financial');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [params.restaurantId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `/api/settings/financial?restaurantId=${params.restaurantId}`
      );
      const data = await response.json();
      setSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/settings/financial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: params.restaurantId,
          ...data,
        }),
      });

      if (response.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      {/* Settings form */}
    </div>
  );
}
```

---

## Environment Configuration

See `.env.example` for complete configuration.

**Key Variables:**

```bash
# Payment
PAYMENT_PROVIDER=stripe
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...

# Delivery
DRIVER_PROVIDER=shipday
SHIPDAY_API_KEY=your_api_key
SHIPDAY_DRY_RUN=false

# Distance Calculation
MAPBOX_TOKEN=your_mapbox_token
```

---

## Next Steps

1. **Run database migrations:**
   ```bash
   npm run schema:combine
   npm run db:push
   ```

2. **Configure environment variables** (see `.env.example`)

3. **Implement API routes** for settings management

4. **Build frontend components** with i18n support

5. **Test order calculations** thoroughly

---

## Support

For issues or questions, refer to:
- [Menu System Documentation](./MENU_SYSTEM_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
