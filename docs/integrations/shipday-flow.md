# Shipday Integration Flow

## Overview

This document describes the complete Shipday delivery integration flow for OrderChop platform. The integration automatically dispatches delivery orders to Shipday when configured, similar to how customer orders will integrate with Stripe for payment processing.

**Why This Matters:** The Shipday integration pattern serves as a reference for future integrations (e.g., customer-facing orders → Stripe payment → delivery dispatch). Understanding this flow is critical for maintaining consistency across the platform.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [Order Creation Flow](#order-creation-flow)
4. [Required Fields](#required-fields)
5. [API Integration Details](#api-integration-details)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Future Integration Pattern](#future-integration-pattern)

---

## Architecture

### High-Level Flow

```
User Creates Order → Order Saved to DB → Shipday API Called → Delivery Info Updated
                                      ↓
                                   Success?
                                   ↙    ↘
                            YES: Update    NO: Log Error
                           deliveryInfo    (Order still created)
```

### Components Involved

1. **Frontend**: `components/shared/OrderModal.tsx`
   - Collects order details
   - Shows prep time and pickup time
   - Prevents editing Shipday orders

2. **Backend**: `lib/serverActions/kitchen.actions.ts`
   - Validates order data
   - Calculates fees and totals
   - Calls Shipday API after order creation

3. **Delivery Factory**: `lib/delivery/DeliveryFactory.ts`
   - Manages delivery provider instances
   - Supports multiple providers (Shipday, local, etc.)

4. **Shipday Provider**: `lib/delivery/providers/ShipdayDeliveryProvider.ts`
   - Implements Shipday API integration
   - Handles quote requests and order creation

---

## Configuration

### Environment Variables

```env
# Required for Shipday integration
SHIPDAY_API_KEY=ATGbo7BFUH.vJuoj5YNGO0Obbgig4hW
SHIPDAY_BASE_URL=https://api.shipday.com
SHIPDAY_DRY_RUN=false  # Set to 'true' for sandbox testing

# Required for distance calculation
MAPBOX_TOKEN=pk.eyJ1IjoiZmVsaXBlaW1wMjIi...
```

### Restaurant Configuration

In `DeliverySettings` model:
- **driverProvider**: Set to "shipday"
- **enabled**: Must be `true`
- **maximumRadius**: Maximum delivery distance (miles or km)
- **pricingTiers**: Used for local delivery only (ignored for Shipday)

---

## Order Creation Flow

### Step 1: User Input (OrderModal)

**Fields Collected:**
- Customer name, phone, email
- Delivery address (using LocationAutocomplete)
- Order items and modifiers
- **Prep time** (default: 30 minutes, editable)
- **Scheduled pickup time** (auto-calculated: current time + prep time)

**Validation:**
- Delivery address is required for delivery orders
- For Shipday: Address must be complete string (not just coordinates)
- Phone number is required
- Items must have valid menu item IDs

### Step 2: Order Saved to Database

**Fields Stored in Order Model:**
```typescript
{
  orderNumber: "ORD-{timestamp}-{random}",
  customerName: string,
  customerPhone: string,
  deliveryAddress: string,
  prepTime: number,  // Minutes
  scheduledPickupTime: Date,
  deliveryFee: number,
  deliveryInfo: {
    distance: number,
    distanceUnit: "miles" | "km",
    provider: "shipday",
    // ... more fields added after Shipday call
  },
  ...otherFields
}
```

### Step 3: Shipday API Call

**Triggered When:**
- `orderType === 'delivery'`
- `deliveryInfo.provider === 'shipday'`

**API Endpoint:** `POST https://api.shipday.com/order`

**Request Payload:**
```typescript
{
  orderNumber: string,           // Unique order number
  restaurantName: string,        // Restaurant name
  restaurantAddress: string,     // Full formatted address
  restaurantPhoneNumber: string, // Restaurant phone
  customerName: string,          // Customer name
  customerAddress: string,       // Full delivery address
  customerPhoneNumber: string,   // Customer phone
  customerEmail: string,         // Optional
  orderValue: number,            // Total order amount
  tip: number,                   // Tip amount (default: 0)
  deliveryInstruction: string,   // Special instructions
  pickupTime: string,            // ISO 8601 datetime (scheduledPickupTime)
  orderItems: [{
    name: string,
    quantity: number
  }]
}
```

**Authentication:**
- Header: `Authorization: Basic {SHIPDAY_API_KEY}`
- Note: API key is used directly, **NOT** base64 encoded

### Step 4: Update Order with Shipday Info

**On Success:**
```typescript
await prisma.order.update({
  where: { id: order.id },
  data: {
    deliveryInfo: {
      ...existingDeliveryInfo,
      externalId: shipdayResult.externalId,     // Shipday order ID
      trackingUrl: shipdayResult.trackingUrl,   // Tracking link
      status: shipdayResult.status               // Delivery status
    }
  }
});
```

**On Failure:**
- Order creation still succeeds
- Error is logged to console
- Restaurant can manually dispatch delivery

---

## Required Fields

### Mandatory Fields (API will reject without these)

| Field | Source | Format | Example |
|-------|--------|--------|---------|
| `orderNumber` | Generated | String | "ORD-1699901234-AB12C" |
| `restaurantName` | Restaurant.name | String | "Pizza Palace" |
| `restaurantAddress` | Restaurant address fields | String | "123 Main St, City, State 12345" |
| `restaurantPhoneNumber` | Restaurant.phone | String | "+1 234 567 8900" |
| `customerName` | Order input | String | "John Doe" |
| `customerAddress` | Order input | String | "456 Oak Ave, City, State 67890" |
| `customerPhoneNumber` | Order input | String | "+1 987 654 3210" |
| `orderValue` | Calculated | Number | 45.50 |
| `pickupTime` | scheduledPickupTime | ISO 8601 | "2025-11-16T14:30:00Z" |

### Optional Fields

| Field | Source | Default |
|-------|--------|---------|
| `customerEmail` | Order input | "" |
| `tip` | Order.tip | 0 |
| `deliveryInstruction` | specialInstructions | "" |
| `orderItems` | Order items | [] |

---

## API Integration Details

### Shipday API Endpoints Used

1. **Get Quote** (used in delivery fee calculation)
   - **Endpoint:** `POST /driver/availability`
   - **Purpose:** Get delivery fee estimate
   - **Response:** Array of available services with fees

2. **Create Delivery** (used after order creation)
   - **Endpoint:** `POST /orders`
   - **Purpose:** Dispatch delivery to Shipday
   - **Response:** Order ID, tracking URL, status

3. **Get Status** (can be used for tracking)
   - **Endpoint:** `GET /orders/{orderId}`
   - **Purpose:** Check delivery status
   - **Response:** Status, driver info, ETA

4. **Cancel Delivery** (for order cancellations)
   - **Endpoint:** `DELETE /orders/{orderId}`
   - **Purpose:** Cancel delivery
   - **Body:** `{ reason: string }`

### Response Handling

**Success Response:**
```typescript
{
  orderId: string,           // Shipday's internal ID
  trackingLink: string,      // URL for tracking
  expectedDeliveryTime: string,  // ISO 8601
  orderState: string,        // "new", "assigned", etc.
  driver: {
    name: string,
    phoneNumber: string,
    location: { latitude: number, longitude: number }
  }
}
```

**Error Response:**
```typescript
{
  errorMessage: string,
  errorCode: string | null
}
```

**Common Error Codes:**
- **403**: Invalid API key or auth
- **400**: Missing required fields
- **500**: Internal server error (usually address parsing issues)

---

## Error Handling

### Strategy: Graceful Degradation

The integration is designed to never fail the entire order creation:

```typescript
try {
  const shipdayResult = await provider.createDelivery({ ... });
  // Update order with Shipday info
} catch (shipdayError) {
  console.error('❌ Failed to create Shipday delivery:', shipdayError.message);
  // Order is still created successfully
  // Restaurant can manually dispatch or retry
}
```

### Error Scenarios

| Scenario | Handling | User Impact |
|----------|----------|-------------|
| Shipday API down | Log error, continue | Order created, manual dispatch needed |
| Invalid address | Log error, continue | Order created, address needs fixing |
| Rate limit hit | Log error, continue | Order created, retry later |
| Auth failure | Log error, continue | Order created, check API key |

### Monitoring

**Console Logs to Watch:**
```
✅ Shipday delivery created: { externalId, trackingUrl }
❌ Failed to create Shipday delivery: {error message}
```

### Retry Logic

Currently no automatic retry. Future enhancement:
- Queue failed deliveries
- Retry with exponential backoff
- Alert admin after N failures

---

## Testing

### Sandbox Mode

**Enable Sandbox:**
```env
SHIPDAY_DRY_RUN=true
```

**Behavior:**
- API calls are simulated
- No actual delivery is created
- Returns mock response with test data
- Fee is always $0 when `isProd: false`

### Test Checklist

- [ ] Create delivery order with Shipday enabled
- [ ] Verify `deliveryInfo.externalId` is populated
- [ ] Check Shipday dashboard for created order
- [ ] Test with sandbox mode (`SHIPDAY_DRY_RUN=true`)
- [ ] Test with production mode
- [ ] Verify pickup time is calculated correctly
- [ ] Test address validation errors
- [ ] Test API failure handling (invalid key)
- [ ] Verify order still creates when Shipday fails

### Manual Testing Steps

1. **Setup:**
   ```
   - Set restaurant driverProvider = "shipday"
   - Configure SHIPDAY_API_KEY in env
   - Enable deliverySettings for restaurant
   ```

2. **Create Order:**
   ```
   - Go to Kitchen page
   - Click "Create In-House Order"
   - Select "Delivery" order type
   - Enter delivery address
   - Set prep time (e.g., 30 min)
   - Verify pickup time auto-calculates
   - Submit order
   ```

3. **Verify:**
   ```
   - Check console for "✅ Shipday delivery created"
   - Go to Shipday dashboard
   - Confirm order appears with correct details
   - Verify deliveryInfo in database has externalId
   ```

---

## Future Integration Pattern

### Why This Matters

The Shipday integration establishes a **critical pattern** for future integrations:

```
Customer Order Flow (Future):
├── Customer places order on website/app
├── Stripe payment intent created
├── Payment confirmed
├── Order saved to database
├── Delivery provider dispatched (Shipday, DoorDash, etc.)
└── Customer receives confirmation + tracking
```

### Similarities to Stripe Integration

| Shipday (Delivery) | Stripe (Payment) | Pattern |
|--------------------|------------------|---------|
| Calculate delivery fee | Calculate payment amount | Pre-calculation |
| Create Shipday order | Create payment intent | External API call |
| Store `externalId` | Store `paymentIntentId` | Reference tracking |
| Graceful failure | Graceful failure | Non-blocking errors |
| Sandbox mode | Test mode | Safe testing |

### Key Principles

1. **Separation of Concerns**
   - Order creation ≠ Delivery dispatch
   - Order can exist without delivery
   - Delivery can be retried/modified

2. **Idempotency**
   - Same order should not create duplicate deliveries
   - Use `externalId` to prevent duplicates

3. **Audit Trail**
   - Store all external service responses
   - Log every API call
   - Track state changes

4. **User Experience**
   - Never block order creation on external services
   - Provide clear error messages
   - Allow manual intervention

---

## Troubleshooting

### Common Issues

**Issue: "Shipday API error: 403"**
- **Cause:** Invalid or missing API key
- **Fix:** Check `SHIPDAY_API_KEY` environment variable
- **Verify:** Run `echo $SHIPDAY_API_KEY` in terminal

**Issue: "Shipday API error: 500"**
- **Cause:** Address parsing failure (passing coordinates instead of string)
- **Fix:** Ensure `deliveryAddress` is full string, not coordinates object
- **Code:** Check that Shipday gets address string, not `{ lat, lng }`

**Issue: "Fee is $0.00"**
- **Cause:** Sandbox mode active (`isProd: false`)
- **Fix:** This is expected in test mode
- **Production:** Fee will be non-zero when `isProd: true`

**Issue: "Order created but not in Shipday"**
- **Cause:** Shipday API call failed silently
- **Check:** Console logs for "❌ Failed to create Shipday delivery"
- **Fix:** Review error message, fix issue, manually dispatch

**Issue: "Cannot edit Shipday order"**
- **Cause:** Order has `deliveryInfo.externalId` (already dispatched)
- **Why:** Editing would require Shipday cancellation + recreation (extra charges)
- **Workaround:** Cancel and create new order, or contact Shipday support

---

## Code References

### Key Files

- **Frontend:** `components/shared/OrderModal.tsx:185-186`
  - Shipday order detection
  - Field disabling logic

- **Backend:** `lib/serverActions/kitchen.actions.ts:530-590`
  - Shipday integration call
  - Error handling

- **Provider:** `lib/delivery/providers/ShipdayDeliveryProvider.ts:102-166`
  - API implementation
  - Request formatting

- **Factory:** `lib/delivery/DeliveryFactory.ts:22-32`
  - Provider initialization
  - Config management

### Database Schema

**Order Model:**
```prisma
model Order {
  // ... other fields
  prepTime              Int?      // Minutes
  scheduledPickupTime   DateTime? // When to pickup
  deliveryInfo          Json?     // Shipday data
}
```

**DeliveryInfo Structure:**
```typescript
{
  distance: number,
  distanceUnit: "miles" | "km",
  provider: "shipday" | "local",
  externalId: string,      // Shipday order ID
  trackingUrl: string,     // Tracking link
  status: string,          // Delivery status
  tierUsed: string,        // For local delivery
  calculationDetails: string
}
```

---

## Conclusion

The Shipday integration demonstrates a robust pattern for third-party service integration:

1. **Collect** all necessary data upfront
2. **Validate** before external API calls
3. **Create** primary record (order) first
4. **Dispatch** to external service
5. **Update** with external reference
6. **Handle** failures gracefully

This pattern will be replicated for:
- Customer payment processing (Stripe)
- SMS notifications (Twilio)
- Email delivery (SendGrid)
- Analytics tracking (Segment)

**Remember:** External services should enhance, not block, core functionality.

---

## Support

**Shipday Documentation:** https://docs.shipday.com/
**OrderChop Internal:** Contact development team
**API Issues:** Check Shipday dashboard status page

---

*Last Updated: 2025-11-16*
*Version: 1.0*
*Author: OrderChop Development Team*
