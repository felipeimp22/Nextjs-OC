# Delivery Fee System Documentation

## Overview

The delivery fee system provides comprehensive support for calculating and charging delivery fees with two different providers:

1. **Local Delivery**: Restaurant's own delivery using flexible pricing tiers
2. **Shipday Integration**: Third-party delivery service with real-time quotes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Order Creation Flow                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Order Type?      │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐       ┌─────────┐
    │ Dine-In │        │ Pickup  │       │Delivery │
    └─────────┘        └─────────┘       └────┬────┘
          │                  │                 │
          └──────────────────┴─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Calculate:       │
                    │ - Subtotal       │
                    │ - Taxes          │
                    │ - Platform Fee   │
                    └────────┬─────────┘
                             │
               ┌─────────────┴─────────────┐
               │ Is Delivery?              │
               └────────┬─────────┬────────┘
                        │ NO      │ YES
                        │         │
                        │         ▼
                        │  ┌──────────────────┐
                        │  │ Delivery Address │
                        │  │ Provided?        │
                        │  └────────┬─────────┘
                        │           │
                        │           ▼
                        │  ┌──────────────────┐
                        │  │ Calculate        │
                        │  │ Distance (Mapbox)│
                        │  └────────┬─────────┘
                        │           │
                        │           ▼
                        │  ┌──────────────────┐
                        │  │ Within Radius?   │
                        │  └────┬───────┬─────┘
                        │   NO  │       │ YES
                        │       │       │
                        │       ▼       ▼
                        │   [ERROR] ┌──────────────┐
                        │           │ Provider?    │
                        │           └──┬────────┬──┘
                        │              │        │
                        │          LOCAL    SHIPDAY
                        │              │        │
                        │              ▼        ▼
                        │         ┌────────┐ ┌───────────┐
                        │         │ Tier   │ │ API       │
                        │         │ Calc   │ │ Quote     │
                        │         └───┬────┘ └─────┬─────┘
                        │             │            │
                        │             └────────┬───┘
                        │                      │
                        └──────────────────────┤
                                               ▼
                                    ┌──────────────────┐
                                    │ Total = Subtotal │
                                    │ + Tax            │
                                    │ + Platform Fee   │
                                    │ + Delivery Fee   │
                                    └──────────────────┘
```

---

## Database Schema

### DeliverySettings

Stored in `Restaurant.deliverySettings`:

```typescript
{
  enabled: boolean,
  distanceUnit: 'miles' | 'km',
  maximumRadius: number,
  driverProvider: 'local' | 'shipday',
  pricingTiers: Array<{
    name: string,
    distanceCovered: number,
    baseFee: number,
    additionalFeePerUnit: number,
    isDefault: boolean
  }>
}
```

### Order Fields

Added to `Order` model:

```typescript
{
  deliveryFee: number,
  deliveryFeeDetails: {
    distance: number,
    distanceUnit: 'miles' | 'km',
    provider: 'local' | 'shipday',
    tierUsed?: string,
    calculationDetails?: string
  },
  customerAddress: {
    address: string
  }
}
```

---

## Local Delivery Calculation

### Pricing Tier Logic

```javascript
if (distance <= tier.distanceCovered) {
  deliveryFee = tier.baseFee;
} else {
  extraDistance = distance - tier.distanceCovered;
  deliveryFee = tier.baseFee + (extraDistance * tier.additionalFeePerUnit);
}
```

### Examples

**Example 1: Within Base Coverage**
```
Settings:
- Distance Covered: 10 miles
- Base Fee: $5.00
- Additional Fee Per Unit: $1.00

Customer Distance: 8 miles

Calculation:
8 miles ≤ 10 miles
Delivery Fee = $5.00 (base fee only)
```

**Example 2: Beyond Base Coverage**
```
Settings:
- Distance Covered: 10 miles
- Base Fee: $5.00
- Additional Fee Per Unit: $1.00

Customer Distance: 15 miles

Calculation:
15 miles > 10 miles
Extra Distance = 15 - 10 = 5 miles
Delivery Fee = $5.00 + (5 × $1.00) = $10.00
```

**Example 3: Multiple Tiers**
```
Tier 1 (Default):
- Distance Covered: 5 miles
- Base Fee: $3.00
- Additional Fee Per Unit: $0.50

Tier 2 (Premium):
- Distance Covered: 15 miles
- Base Fee: $8.00
- Additional Fee Per Unit: $1.50

Customer Distance: 7 miles
Using Default Tier:
7 miles > 5 miles
Extra Distance = 7 - 5 = 2 miles
Delivery Fee = $3.00 + (2 × $0.50) = $4.00
```

---

## Shipday Integration

### API Flow

```
1. Send Quote Request:
   POST https://api.shipday.com/deliveries/quote
   {
     pickupAddress: "Restaurant Address",
     deliveryAddress: "Customer Address",
     pickupBusinessName: "Restaurant Name",
     deliveryName: "Customer Name",
     deliveryPhoneNumber: "Customer Phone",
     orderValue: 45.00
   }

2. Receive Quote Response:
   {
     deliveryFee: 8.50,
     currency: "USD",
     estimatedTime: 30,
     carrierId: "carrier-123",
     carrierName: "Fast Delivery Co"
   }

3. Currency Conversion (if needed):
   If quote currency ≠ restaurant currency:
   - Fetch exchange rate from API
   - Convert delivery fee to restaurant currency
   - Store both original and converted amounts

4. Include in Order Total:
   Total = Subtotal + Tax + Platform Fee + Delivery Fee (converted)
```

### Dry Run Mode

For testing without making real API calls:

```env
SHIPDAY_DRY_RUN=true
```

When enabled, returns mock data:
```javascript
{
  success: true,
  deliveryFee: 8.50,
  currency: 'USD',
  estimatedTime: 30,
  carrierId: 'mock-carrier',
  carrierName: 'Mock Carrier (Dry Run)'
}
```

---

## Distance Calculation

### Mapbox Integration

**Geocoding** (Address → Coordinates):
```javascript
import { geocodeAddress } from '@/lib/utils/distanceCalculator';

const result = await geocodeAddress("123 Main St, City, State 12345");
// {
//   success: true,
//   coordinates: { longitude: -73.935242, latitude: 40.730610 },
//   address: "123 Main Street, New York, NY 10001, USA"
// }
```

**Distance Calculation** (Driving Distance):
```javascript
import { calculateDrivingDistance } from '@/lib/utils/distanceCalculator';

const result = await calculateDrivingDistance(
  { longitude: -73.935242, latitude: 40.730610 },
  { longitude: -73.989308, latitude: 40.758896 },
  'miles'
);
// {
//   distance: 3.2,
//   unit: 'miles',
//   withinRadius: true,
//   maximumRadius: 10
// }
```

### Fallback Mechanism

If Mapbox API fails:
1. Uses Haversine formula for straight-line distance
2. Logs warning about fallback usage
3. Continues with order processing

```javascript
// Haversine formula calculates "as the crow flies" distance
// Less accurate than driving distance but ensures orders aren't blocked
const straightLineDistance = calculateHaversineDistance(origin, destination);
```

---

## Payment Collection Rules

### CRITICAL: Provider-Based Collection

```
┌────────────────────────────────────────────────────────────┐
│                  PAYMENT COLLECTION RULES                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  LOCAL DELIVERY:                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Restaurant Collects via Stripe:                  │    │
│  │ • Subtotal                                       │    │
│  │ • Tax                                            │    │
│  │ • Delivery Fee                                   │    │
│  │ • Tip (if applicable)                            │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Platform Collects:                               │    │
│  │ • Platform Fee ONLY                              │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│────────────────────────────────────────────────────────────│
│                                                            │
│  SHIPDAY DELIVERY:                                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Restaurant Collects via Stripe:                  │    │
│  │ • Subtotal                                       │    │
│  │ • Tax                                            │    │
│  │ • Customer Tip (optional)                        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Platform Collects:                               │    │
│  │ • Platform Fee                                   │    │
│  │ • Delivery Fee (full amount)                     │    │
│  │ • Driver Tip (full amount)                       │    │
│  │   ↓                                              │    │
│  │   Platform pays Shipday (delivery fee + driver   │    │
│  │   tip), Shipday pays the driver                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Implementation Notes

**For Stripe Integration:**
```javascript
// LOCAL DELIVERY
const restaurantAmount = subtotal + tax + deliveryFee + customerTip + driverTip;
const platformAmount = platformFee;

// SHIPDAY DELIVERY
const restaurantAmount = subtotal + tax + customerTip;
const platformAmount = platformFee + deliveryFee + driverTip;
// Platform then pays Shipday (deliveryFee + driverTip) separately
```

**Why Different Collection?**

- **Local**: Restaurant owns the delivery operation, keeps delivery fee and driver tips
- **Shipday**: Platform facilitates third-party delivery, collects delivery fee AND driver tip to pay Shipday (who then pays the driver)

**Currency Note:**
All values are in the restaurant's configured currency. No currency conversion is needed when calculating fees.

---

## Currency Conversion

### When Conversion Happens

Shipday may charge in a different currency than the restaurant's currency. The system automatically handles conversion.

### Conversion Flow

```javascript
// 1. Detect currency mismatch
if (shipdayCurrency !== restaurantCurrency) {

  // 2. Fetch exchange rate
  const rate = await getExchangeRate(shipdayCurrency, restaurantCurrency);

  // 3. Convert amount
  const convertedFee = shipdayFee * rate;

  // 4. Store both amounts
  order.deliveryFee = convertedFee;  // In restaurant currency
  order.deliveryFeeDetails = {
    originalFee: shipdayFee,
    originalCurrency: shipdayCurrency,
    convertedFee: convertedFee,
    currency: restaurantCurrency,
    exchangeRate: rate
  };
}
```

### Exchange Rate API

Currently using `exchangerate-api.com` (free tier):

```javascript
GET https://api.exchangerate-api.com/v4/latest/USD
```

**Production Recommendation**: Use a paid service like:
- Currencyapi.com
- OpenExchangeRates.org
- XE Currency Data API

---

## Environment Variables

### Required Configuration

```env
# Mapbox (for distance calculation and geocoding)
MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxx

# Shipday (for third-party delivery)
SHIPDAY_API_KEY=ATGbo7BFUH.vJuoj5YNGO0Obbgig4hW
SHIPDAY_BASE_URL=https://api.shipday.com
SHIPDAY_DRY_RUN=false  # Set to true for testing
```

### Getting API Keys

**Mapbox:**
1. Sign up at https://account.mapbox.com/
2. Create a new access token
3. Enable "Geocoding" and "Directions" scopes
4. Add to `.env.local`

**Shipday:**
1. Sign up at https://shipday.com/
2. Go to Settings → API
3. Copy API key
4. Add to `.env.local`

---

## Frontend Implementation

### Order Modal Updates

```typescript
// 1. Added delivery address field
const [deliveryAddress, setDeliveryAddress] = useState('');

// 2. Conditional display
{orderType === 'delivery' && (
  <Input
    value={deliveryAddress}
    onChange={e => setDeliveryAddress(e.target.value)}
    placeholder="Enter full delivery address"
  />
)}

// 3. Validation
if (orderType === 'delivery' && !deliveryAddress.trim()) {
  showToast('error', 'Please enter a delivery address');
  return;
}

// 4. Include in order submission
const input = {
  // ... other fields
  deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
};
```

### Props Required

OrderModal now requires:
```typescript
interface OrderModalProps {
  // ... existing props
  deliverySettings?: DeliverySettings | null;
  restaurantAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  restaurantName?: string;
}
```

---

## Backend Implementation

### Kitchen Actions

**createInHouseOrder** and **updateInHouseOrder** both include:

```typescript
// 1. Fetch delivery settings
const restaurant = await prisma.restaurant.findUnique({
  where: { id: restaurantId },
  include: {
    financialSettings: true,
    deliverySettings: true,  // ← Added
  },
});

// 2. Calculate delivery fee (if delivery order)
let deliveryFee = 0;
let deliveryFeeDetails = null;

if (input.orderType === 'delivery') {
  // Validate address
  if (!input.deliveryAddress) {
    return { success: false, error: 'Delivery address required' };
  }

  // Calculate using utility
  const deliveryResult = await calculateDeliveryFee(
    restaurantAddress,
    input.deliveryAddress,
    deliverySettings,
    currencySymbol,
    restaurantName,
    customerName,
    customerPhone,
    subtotal + tax + platformFee
  );

  // Handle errors
  if (deliveryResult.error) {
    return { success: false, error: deliveryResult.error };
  }

  deliveryFee = deliveryResult.deliveryFee;
  deliveryFeeDetails = { /* ... */ };
}

// 3. Include in total
const total = subtotal + tax + platformFee + deliveryFee;

// 4. Save to database
await prisma.order.create({
  data: {
    // ... other fields
    deliveryFee,
    deliveryFeeDetails,
    customerAddress: { address: input.deliveryAddress },
    total,
  },
});
```

---

## Error Handling

### Common Errors and Solutions

**1. "Delivery address is required for delivery orders"**
- **Cause**: User didn't enter delivery address
- **Solution**: Ensure address field is filled before submitting

**2. "Delivery address is outside the X mile delivery radius"**
- **Cause**: Customer is too far from restaurant
- **Solution**: Inform customer they're out of range, suggest pickup

**3. "Delivery is not enabled for this restaurant"**
- **Cause**: Restaurant hasn't configured delivery settings
- **Solution**: Go to Settings → Delivery and configure

**4. "Mapbox access token not configured"**
- **Cause**: Missing `MAPBOX_TOKEN`
- **Solution**: Add token to `.env.local`, falls back to Haversine distance

**5. "Shipday API error: 401 Unauthorized"**
- **Cause**: Invalid or missing Shipday API key
- **Solution**: Verify `SHIPDAY_API_KEY` in `.env.local`

**6. "Failed to geocode address"**
- **Cause**: Invalid or incomplete address
- **Solution**: Ask customer to provide complete address with city, state, zip

**7. "Currency conversion failed"**
- **Cause**: Exchange rate API error
- **Solution**: Uses original Shipday amount, logs warning

---

## Testing

### Test Scenarios

**1. Local Delivery - Within Base Coverage**
```javascript
// Setup
deliverySettings = {
  enabled: true,
  distanceUnit: 'miles',
  maximumRadius: 10,
  driverProvider: 'local',
  pricingTiers: [{
    name: 'Default',
    distanceCovered: 5,
    baseFee: 5.00,
    additionalFeePerUnit: 1.00,
    isDefault: true
  }]
};

// Test
restaurantAddress = "123 Main St, City, State 12345";
customerAddress = "456 Oak Ave, City, State 12345";  // 3 miles away

// Expected
deliveryFee = $5.00
```

**2. Local Delivery - Beyond Base Coverage**
```javascript
// Same setup as above

// Test
customerAddress = "789 Pine Rd, City, State 12345";  // 7 miles away

// Expected
deliveryFee = $5.00 + (2 miles × $1.00) = $7.00
```

**3. Local Delivery - Out of Radius**
```javascript
// Same setup as above

// Test
customerAddress = "999 Far Ln, OtherCity, State 99999";  // 15 miles away

// Expected
Error: "Delivery address is outside the 10 mile delivery radius"
```

**4. Shipday Delivery**
```javascript
// Setup
deliverySettings = {
  enabled: true,
  distanceUnit: 'miles',
  maximumRadius: 10,
  driverProvider: 'shipday',
  pricingTiers: []  // Not used for Shipday
};

// Test
SHIPDAY_DRY_RUN=true
customerAddress = "456 Oak Ave, City, State 12345";

// Expected
deliveryFee = $8.50 (mock data)
provider = 'shipday'
```

**5. Currency Conversion**
```javascript
// Setup
deliverySettings.driverProvider = 'shipday';
restaurantCurrency = 'EUR';
shipdayResponse = { deliveryFee: 10, currency: 'USD' };

// Test
Exchange rate: 1 USD = 0.92 EUR

// Expected
deliveryFee = 9.20 EUR
deliveryFeeDetails.originalFee = 10.00 USD
```

### Testing Checklist

- [ ] Local delivery within base coverage
- [ ] Local delivery beyond base coverage
- [ ] Local delivery outside maximum radius
- [ ] Shipday delivery quote (dry run)
- [ ] Shipday delivery quote (live)
- [ ] Currency conversion (if applicable)
- [ ] Missing delivery address validation
- [ ] Delivery disabled restaurant
- [ ] Mapbox geocoding failure fallback
- [ ] Order total includes delivery fee
- [ ] Delivery fee saved to database
- [ ] Delivery address saved to order

---

## Console Logging

The system includes comprehensive logging for debugging:

```javascript
// Distance Calculation
🌍 Geocoding address: 123 Main St, City, State
✅ Geocoding successful: { coordinates: {...} }
🚗 Calculating driving distance...
✅ Distance calculated: 3.2 miles (15 minutes)

// Delivery Fee Calculation
=== DELIVERY FEE CALCULATION (createInHouseOrder) ===
Using centralized deliveryFeeCalculator utility
💵 Calculating local delivery fee...
✅ Local delivery fee calculated:
   - Tier: Default
   - Fee: $7.00
   - Details: Base fee ($5.00) + 2.00 miles × $1.00 = $7.00

// Or for Shipday
📦 Requesting Shipday quote...
✅ Shipday quote received: { deliveryFee: 8.50, carrier: 'Fast Delivery' }
💱 Currency conversion: 8.50 USD → 7.82 EUR (rate: 0.92)
```

---

## Performance Considerations

### API Call Optimization

**Problem**: Multiple API calls can slow down order creation

**Solutions**:
1. **Caching**: Cache geocoded addresses for frequently used locations
2. **Debouncing**: Debounce address input to reduce geocoding requests
3. **Lazy Loading**: Only calculate delivery fee when user selects delivery
4. **Parallel Processing**: Run geocoding and Shipday requests in parallel

### Example Caching

```typescript
const addressCache = new Map<string, Coordinates>();

export async function geocodeAddressWithCache(address: string) {
  if (addressCache.has(address)) {
    return addressCache.get(address);
  }

  const result = await geocodeAddress(address);
  if (result.success && result.coordinates) {
    addressCache.set(address, result.coordinates);
  }

  return result;
}
```

---

## Future Enhancements

### Planned Features

1. **Address Autocomplete**
   - Integrate Google Places or Mapbox Autocomplete
   - Reduce geocoding errors
   - Improve UX

2. **Dynamic Pricing**
   - Time-based pricing (surge during peak hours)
   - Demand-based pricing
   - Weather-based adjustments

3. **Multiple Carriers**
   - Support for DoorDash, Uber Eats APIs
   - Automatic carrier selection (cheapest/fastest)
   - Carrier comparison display

4. **Delivery Zones**
   - Define custom delivery zones (polygons)
   - Different pricing per zone
   - Visual zone editor

5. **Estimated Delivery Time**
   - Calculate ETA based on distance
   - Factor in restaurant prep time
   - Display to customer

6. **Driver Assignment (Local)**
   - Driver management system
   - Auto-assign orders to available drivers
   - Real-time tracking

7. **Analytics**
   - Track delivery fee revenue
   - Average delivery distance
   - Provider performance comparison
   - Geographic heatmap of deliveries

---

## Troubleshooting Guide

### Delivery Fee Not Calculating

**Check:**
1. Is orderType set to 'delivery'?
2. Is delivery enabled in restaurant settings?
3. Is delivery address provided?
4. Check browser/server console for errors
5. Verify Mapbox token is valid
6. Verify Shipday API key (if using Shipday)

### Wrong Delivery Fee Amount

**Check:**
1. Verify pricing tier configuration
2. Check distance calculation (console logs)
3. Verify distance unit (miles vs km)
4. Check currency conversion (if applicable)
5. Review calculation details in logs

### Address Not Geocoding

**Check:**
1. Is address complete? (street, city, state, zip)
2. Is Mapbox token valid and has geocoding scope?
3. Check address format (US vs international)
4. Try simplifying address (remove apartment numbers)
5. Check Mapbox API quota/rate limits

### Shipday API Errors

**Check:**
1. Is SHIPDAY_API_KEY set correctly?
2. Is Shipday account active?
3. Check Shipday account balance/credits
4. Verify restaurant address is in Shipday service area
5. Enable SHIPDAY_DRY_RUN for testing

---

## Related Documentation

- [CALCULATION_UTILITIES_GUIDE.md](./CALCULATION_UTILITIES_GUIDE.md) - Tax and fee calculation utilities
- [PRICING_AND_CALCULATIONS_GUIDE.md](./PRICING_AND_CALCULATIONS_GUIDE.md) - Complete pricing system
- [SETTINGS_SYSTEM_GUIDE.md](./SETTINGS_SYSTEM_GUIDE.md) - Restaurant settings configuration

---

## Summary

The delivery fee system provides:

✅ **Flexible Delivery Options**: Local or Shipday delivery
✅ **Accurate Distance Calculation**: Mapbox driving distance
✅ **Configurable Pricing**: Tier-based local pricing
✅ **Real-Time Quotes**: Shipday API integration
✅ **Currency Support**: Automatic currency conversion
✅ **Radius Enforcement**: Maximum delivery distance validation
✅ **Payment Rules**: Provider-based collection logic
✅ **Comprehensive Logging**: Easy debugging and troubleshooting
✅ **Error Handling**: Graceful fallbacks and clear error messages
✅ **Reusable Utilities**: Centralized calculation logic

The system is production-ready for in-house orders and can be extended to customer-facing flows (store, checkout) by reusing the same centralized utilities.
