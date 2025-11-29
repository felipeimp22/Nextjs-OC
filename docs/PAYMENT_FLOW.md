# Payment Flow Documentation

## Overview

OrderChop uses **Stripe Connect** to process payments. All payments go directly to restaurant Stripe Connect accounts, with OrderChop collecting a platform fee as an application fee.

## Payment Flow

### 1. Order Creation
- Customer places an order and proceeds to checkout
- Order is created with status: `pending`, paymentStatus: `pending`
- Platform fee is calculated:
  - If order subtotal < $10: Platform fee = 10% of subtotal
  - If order subtotal >= $10: Platform fee = **$1.95 flat**

### 2. Payment Intent Creation
- System checks if restaurant has Stripe Connect account configured
- **Required**: Restaurant must have:
  - `stripeAccountId` set
  - `stripeConnectStatus` = `connected`
- If not connected: Order cannot proceed, error returned
- Payment intent is created on restaurant's Stripe Connect account
- `applicationFeeAmount` is set to platform fee ($1.95)

### 3. Payment Processing
- Customer enters payment details using Stripe Elements
- Payment is processed on restaurant's Stripe Connect account
- **Money flow**:
  - Full payment goes to restaurant Stripe account
  - Platform fee ($1.95) is automatically deducted as application fee
  - Restaurant receives: `Total - $1.95`
  - OrderChop receives: `$1.95`

### 4. Webhook Processing
When payment succeeds, Stripe sends webhook:
- Order status updated: `paymentStatus: 'paid'`, `status: 'confirmed'`
- Transaction record created with:
  - `amount`: Total payment amount
  - `platformFee`: $1.95 (application fee)
  - `restaurantAmount`: Total - $1.95
  - `paymentProvider`: 'stripe'
  - `status`: 'succeeded'

## Application Fee Collection (Shipday Deliveries)

### Important: Driver Tip Included

For Shipday deliveries, the platform collects:
- Platform fee (based on GlobalFee settings)
- Delivery fee (to pay Shipday)
- **Driver tip** (to pay Shipday who pays driver)

```typescript
// Shipday delivery application fee calculation
if (isShipdayDelivery) {
  const driverTipCents = Math.round((order.driverTip || 0) * 100);
  applicationFeeAmount = platformFeeInCents + deliveryFeeInCents + driverTipCents;
}
```

### Currency Note
All fees are in the restaurant's configured currency. No conversion is needed.
GlobalFee values (threshold, aboveFlat) are set in restaurant's currency.

For example:
- US restaurant (USD): `aboveFlat: 1.95` means $1.95 USD
- Brazilian restaurant (BRL): `aboveFlat: 1.95` means R$1.95 BRL

## Platform Fee Structure

```typescript
interface GlobalFee {
  enabled: boolean;      // true by default
  threshold: number;     // $10.00
  belowPercent: number;  // 10% for orders < $10
  aboveFlat: number;     // $1.95 for orders >= $10
}
```

### Examples:

**Order $8.50 (below threshold):**
- Subtotal: $8.50
- Platform Fee: $0.85 (10%)
- Restaurant receives: $7.65
- OrderChop receives: $0.85

**Order $25.00 (above threshold):**
- Subtotal: $25.00
- Platform Fee: $1.95 (flat)
- Restaurant receives: $23.05
- OrderChop receives: $1.95

## Stripe Connect Setup

### For New Restaurants:
- `usePlatformAccountFallback` is set to `false` by default
- Restaurant **must** connect Stripe account before accepting orders
- Cannot process payments without connected account

### For Existing Restaurants:
- Run migration script to disable platform fallback:
  ```bash
  npx tsx scripts/migrate-disable-platform-fallback.ts
  ```
- Restaurants without Stripe Connect must set up account:
  1. Go to Settings > Financial > Payment Provider
  2. Click "Connect Stripe Account"
  3. Complete Stripe Connect onboarding

## Configuration

### Financial Settings Model:
```prisma
model FinancialSettings {
  stripeAccountId String?  // Restaurant's Stripe Connect account ID
  stripeConnectStatus String @default("not_connected")
  usePlatformAccountFallback Boolean @default(false)
  globalFee GlobalFee?
  // ...
}
```

### Payment Intent Options:
```typescript
{
  amount: totalInCents,
  currency: 'usd',
  connectedAccountId: restaurant.stripeAccountId,
  applicationFeeAmount: platformFeeInCents,  // $1.95
  metadata: {
    order_id: order.id,
    restaurant_id: restaurant.id,
  }
}
```

## Transaction Records

All successful payments create a transaction record:

```typescript
{
  orderId: string,
  restaurantId: string,
  amount: 25.00,           // Total payment
  platformFee: 1.95,       // OrderChop fee
  restaurantAmount: 23.05, // Restaurant receives
  paymentProvider: 'stripe',
  status: 'succeeded',
  paymentIntentId: 'pi_xxx',
  chargeId: 'ch_xxx'
}
```

## Key Changes

### Before:
- ❌ Platform account fallback enabled by default
- ❌ Payments could go to platform account
- ❌ No application fee for platform payments
- ❌ Restaurant didn't receive funds directly

### After:
- ✅ Platform account fallback disabled
- ✅ All payments go to restaurant Stripe Connect account
- ✅ Platform fee ($1.95) automatically collected as application fee
- ✅ Restaurant receives funds immediately (minus platform fee)
- ✅ Clear transaction records showing fee breakdown

## Testing

### Test Mode:
1. Use Stripe test mode API keys
2. Test card: `4242 4242 4242 4242`
3. Any future expiry date, any 3-digit CVC
4. Check webhook logs for payment_intent.succeeded
5. Verify transaction record shows correct amounts

### Verification:
- Restaurant Stripe dashboard shows payment minus application fee
- Platform Stripe dashboard shows application fee received
- Order status updated to 'confirmed'
- Transaction record created with correct amounts

## Support

If a restaurant cannot accept orders:
1. Check `stripeConnectStatus` in financial settings
2. Verify `stripeAccountId` is set
3. Ensure Stripe account is fully onboarded
4. Check webhook endpoint is configured correctly
5. Review Stripe Connect account charges_enabled status
