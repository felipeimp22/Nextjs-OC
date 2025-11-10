# Order Flow & Payment Integration Setup Guide

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Environment Variables](#environment-variables)
5. [Local Development Setup](#local-development-setup)
6. [Stripe Integration](#stripe-integration)
7. [Testing the Flow](#testing-the-flow)
8. [Production Deployment](#production-deployment)
9. [Webhook Configuration](#webhook-configuration)
10. [Currency Conversion](#currency-conversion)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This multi-tenant restaurant platform enables restaurants to sell food online with a complete order and payment flow. Key highlights:

- **Customer-facing storefront** at `/{id}/store`
- **Stripe Connect** for direct payments to restaurants
- **Multi-currency support** with automatic conversion for platform fees
- **Location-based delivery** with Mapbox autocomplete
- **Complex pricing** with modifiers, options, and menu rules
- **Real-time webhook** processing for payment events
- **Professional checkout** with Stripe Elements

---

## Features

### ✅ Customer Features

- Browse menu by category
- Add items to cart with customizable modifiers
- Choose pickup or delivery
- Address autocomplete with house number validation (Mapbox)
- Real-time order calculation (taxes, delivery fees, platform fees)
- Secure payment with Stripe
- Mobile responsive design

### ✅ Restaurant Features

- Stripe Connect onboarding
- Direct payment to restaurant account
- Automatic platform fee deduction
- Multi-currency support
- Delivery distance-based pricing
- Tax configuration
- Order management

### ✅ Platform Features

- Multi-tenant architecture
- Payment provider abstraction (Stripe, MercadoPago ready)
- Webhook handling for async events
- Currency conversion for platform fees
- PCI compliance via Stripe

---

## Architecture

### Payment Flow

```
Customer → Stripe Checkout → Restaurant Stripe Account (direct)
                           ↓
                   Platform Fee (automatic deduction)
                           ↓
                   Platform Stripe Account
```

### Data Flow

1. **Menu Display**: Server action fetches public restaurant data
2. **Cart Management**: Zustand store (client-side, persisted)
3. **Order Creation**: Server action creates order record
4. **Payment Intent**: Server action creates Stripe payment intent
5. **Checkout**: Stripe Elements handles payment collection
6. **Webhook**: Stripe notifies platform of payment status
7. **Order Update**: Webhook handler updates order status

### Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: MongoDB
- **Payments**: Stripe Connect, Stripe Elements
- **Maps**: Mapbox Search API
- **State**: Zustand (cart), React Query (server state)

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=mongodb://localhost:27017/orderchop?replicaSet=my-replica-set&directConnection=true

# Stripe (Platform Account)
STRIPE_CLIENT_ID=ca_xxxxx                           # Stripe Connect Client ID
STRIPE_TEST_SECRET_KEY=sk_test_xxxxx               # Platform secret key
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxx          # Platform publishable key
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxx             # Webhook signing secret

# Production (when ready)
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxx
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_LIVE_WEBHOOK_SECRET=whsec_xxxxx

# Mapbox
MAPBOX_TOKEN=pk.xxxxx                               # Mapbox public token
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx                   # Exposed to client

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001           # Your app URL

# Payment Provider (optional, defaults to stripe)
PAYMENT_PROVIDER=stripe
```

### Optional Variables

```bash
# Currency Exchange (for live rates)
EXCHANGE_RATE_API_KEY=xxxxx
```

---

## Local Development Setup

### 1. Prerequisites

- Node.js 18+ and npm
- MongoDB with replica set enabled
- Stripe account (test mode)
- Mapbox account

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all required environment variables (see section above).

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The app will run at `http://localhost:3001` (or your configured port).

### 6. Start Stripe Webhook Listener

In a separate terminal:

```bash
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
```

**Important**: Copy the webhook signing secret from the output and add it to `.env.local`:

```bash
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Stripe Integration

### Step 1: Create Stripe Platform Account

1. Go to [stripe.com](https://stripe.com)
2. Create an account (or log in)
3. Navigate to **Settings → Connect → Overview**
4. Create a **Connect platform** application
5. Note your **Client ID** (`ca_xxxxx`)

### Step 2: Get API Keys

From the Stripe dashboard:

1. **Developers → API keys**
2. Copy:
   - **Publishable key** (`pk_test_xxxxx`)
   - **Secret key** (`sk_test_xxxxx`)

### Step 3: Configure Redirect URIs

In **Settings → Connect → Settings**:

Add redirect URIs:
- `http://localhost:3001/api/stripe/connect` (development)
- `https://yourdomain.com/api/stripe/connect` (production)

### Step 4: Restaurant Onboarding

1. Restaurant owner logs into platform
2. Goes to **Settings → Financial**
3. Clicks **"Connect Stripe Account"**
4. Redirected to Stripe Connect OAuth
5. Completes onboarding (Express account)
6. Redirected back to platform
7. Platform saves `stripeAccountId` to database

### Step 5: Webhook Setup

1. **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Listen to events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `account.updated`
4. Copy **Signing secret** to environment variables

---

## Testing the Flow

### Test Data Setup

Create a test restaurant with:

1. **Menu Categories**: e.g., "Appetizers", "Main Course", "Desserts"
2. **Menu Items**: Add items with prices
3. **Options/Modifiers**: Create options like "Size", "Add-ons"
4. **Menu Rules**: Attach options to items with price adjustments
5. **Financial Settings**:
   - Set currency (e.g., USD, BRL)
   - Configure taxes
   - Connect Stripe account
6. **Delivery Settings** (if offering delivery):
   - Enable delivery
   - Set maximum radius
   - Configure pricing tiers

### Test Flow

#### 1. Access Storefront

Navigate to: `http://localhost:3001/{id}/store`

Replace `{id}` with actual restaurant ID from database.

#### 2. Browse Menu

- View menu categories
- Click category to filter items
- View item details

#### 3. Add Items to Cart

- Click "Add to Cart" for simple items
- Click "Customize" for items with modifiers
- Select options (required and optional)
- Add special instructions (if allowed)
- Adjust quantity
- Confirm

#### 4. View Cart

- Cart sidebar shows all items
- Displays selected options
- Shows quantity controls
- Shows subtotal

#### 5. Proceed to Checkout

- Click "Proceed to Checkout"
- Select order type (Pickup or Delivery)

#### 6. Enter Contact Info

- Name
- Email
- Phone

#### 7. Delivery Address (if delivery)

- Type address in autocomplete
- Select from suggestions
- Verify house number is present
- Address auto-validates

#### 8. Review Order Summary

- Subtotal
- Taxes (itemized)
- Delivery fee (if delivery)
- Platform fee
- Total

#### 9. Payment

Use Stripe test cards:

**Success**:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Decline**:
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

**3D Secure (requires authentication)**:
```
Card Number: 4000 0025 0000 3155
```

#### 10. Order Confirmation

- Payment processes
- Webhook updates order status
- Customer redirected to confirmation page
- Order appears in restaurant dashboard

---

## Production Deployment

### 1. Environment Variables

Update `.env.production`:

```bash
# Use LIVE Stripe keys
STRIPE_CLIENT_ID=ca_xxxxx
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxx
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_LIVE_WEBHOOK_SECRET=whsec_xxxxx

# Production URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Production database
DATABASE_URL=mongodb://your-production-db
```

### 2. Stripe Production Setup

1. Activate your Stripe account (provide business details)
2. Request production access for Connect
3. Update redirect URIs to production URLs
4. Create production webhook endpoint
5. Update webhook secret

### 3. Deploy Application

Deploy to your hosting provider (Vercel, AWS, etc.):

```bash
# Example with Vercel
vercel --prod
```

### 4. Configure Webhooks

In production Stripe dashboard:

1. Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
2. Enable same events as test
3. Copy signing secret to production env vars

### 5. Test in Production

1. Create test restaurant
2. Connect real Stripe account
3. Place test order
4. Verify webhook receipt
5. Check payment in Stripe dashboard
6. Verify platform fee transfer

---

## Webhook Configuration

### Local Testing

```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Start Stripe CLI
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
```

### Production Setup

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Enter: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `account.updated`
5. Save and copy signing secret

### Webhook Events

| Event | Description | Action |
|-------|-------------|--------|
| `payment_intent.succeeded` | Payment completed | Update order status to "paid", create transaction |
| `payment_intent.payment_failed` | Payment failed | Update order status to "failed" |
| `charge.succeeded` | Charge finalized | Store charge ID for refunds |
| `account.updated` | Connected account changed | Update Stripe connection status |

### Webhook Security

- Signature verification via `stripe.webhooks.constructEvent()`
- Signing secret stored in environment variables
- Raw body required for signature validation
- Failed verification returns 400

---

## Currency Conversion

### How It Works

1. **Restaurant currency**: Set in Financial Settings (e.g., BRL, MXN, USD)
2. **Order total**: Calculated in restaurant currency
3. **Platform fee**: Always charged in USD
4. **Conversion**: Automatic conversion for display

### Example

Restaurant in Brazil (BRL):
- Order total: R$100.00 (BRL)
- Platform fee: $1.95 (USD)
- Conversion rate: 1 USD = 5.00 BRL
- Platform fee in BRL: R$9.75
- **Customer sees**: R$109.75 total

### Exchange Rates

Default: Hardcoded fallback rates in `lib/utils/currencyConverter.ts`

For live rates, integrate an API:
- [Exchange Rate API](https://www.exchangerate-api.com/)
- [Open Exchange Rates](https://openexchangerates.org/)
- [Fixer.io](https://fixer.io/)

Update `fetchLiveExchangeRates()` function.

---

## Troubleshooting

### Issue: Webhook not receiving events

**Solution**:
- Check Stripe CLI is running: `stripe listen --forward-to http://localhost:3001/api/webhooks/stripe`
- Verify webhook secret in `.env.local` matches CLI output
- Check webhook endpoint is publicly accessible (production)
- Verify endpoint URL in Stripe dashboard

### Issue: Payment intent creation fails

**Possible causes**:
- Restaurant Stripe account not connected → Check `stripeConnectStatus`
- Invalid Stripe keys → Verify environment variables
- Connected account restricted → Check Stripe dashboard

**Solution**:
- Have restaurant complete onboarding
- Verify Stripe account is active
- Check Stripe dashboard for account issues

### Issue: Address autocomplete not working

**Solution**:
- Verify `MAPBOX_TOKEN` is set
- Check `NEXT_PUBLIC_MAPBOX_TOKEN` for client-side usage
- Ensure Mapbox account has Search API enabled
- Check browser console for API errors

### Issue: Delivery fee not calculating

**Solution**:
- Verify delivery settings are configured
- Check pricing tiers in database
- Ensure address has coordinates
- Verify distance calculation logic

### Issue: Platform fee incorrect

**Solution**:
- Check global fee configuration in Financial Settings
- Verify threshold value (default: $10)
- Review below/above percentage/flat fee settings
- Check currency conversion if using non-USD

### Issue: Order not updating after payment

**Solution**:
- Check webhook is firing (Stripe dashboard → Events)
- Verify webhook signature validation
- Check server logs for errors
- Ensure order ID is in payment metadata

### Issue: Stripe Connect not working

**Solution**:
- Verify `STRIPE_CLIENT_ID` is set
- Check redirect URIs in Stripe Connect settings
- Ensure OAuth callback endpoint is accessible
- Review Stripe Connect application status

---

## Additional Features to Implement

### 1. Order Tracking

- Create order status page
- Real-time updates via webhooks
- Email/SMS notifications
- Estimated delivery time

### 2. Receipt Generation

- PDF receipt creation
- Email receipt to customer
- Include itemized breakdown
- Add restaurant branding

### 3. Analytics

- Revenue dashboard
- Popular items
- Peak hours
- Customer insights

### 4. Refund Handling

- Partial/full refunds
- Refund via Stripe API
- Update transaction records
- Customer notifications

### 5. MercadoPago Integration

- Complete OAuth flow
- Webhook handlers
- Currency support (BRL, MXN, ARS)
- Payment method options

---

## API Endpoints Reference

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/[id]/store` | GET | Customer-facing storefront |
| `/[id]/checkout` | GET | Checkout page |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

### Protected Endpoints (Require Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stripe/connect` | GET | Stripe OAuth callback |
| `/api/stripe/onboarding` | POST | Create onboarding link |
| `/api/stripe/onboarding` | GET | Refresh onboarding link |

### Server Actions

| Action | Description |
|--------|-------------|
| `getPublicRestaurantData` | Fetch restaurant menu and settings |
| `createOrderDraft` | Calculate order total preview |
| `createOrder` | Create order record in database |
| `createPaymentIntent` | Create Stripe payment intent |
| `getOrder` | Retrieve order details |

---

## Security Considerations

### Payment Security

- ✅ PCI compliance via Stripe Elements
- ✅ No card data touches your server
- ✅ Webhook signature verification
- ✅ HTTPS required in production
- ✅ Environment variables for secrets

### Data Privacy

- ✅ Customer data encrypted at rest (MongoDB)
- ✅ Sensitive data not logged
- ✅ Order data tied to restaurant (multi-tenant)
- ✅ No shared customer data between restaurants

### Best Practices

- Never log payment credentials
- Rotate webhook secrets regularly
- Monitor Stripe dashboard for anomalies
- Use environment-specific API keys
- Implement rate limiting on endpoints
- Validate all user inputs
- Sanitize address data

---

## Support & Resources

### Stripe Documentation

- [Stripe Connect](https://stripe.com/docs/connect)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

### Mapbox Documentation

- [Search API](https://docs.mapbox.com/api/search/)
- [Geocoding](https://docs.mapbox.com/api/search/geocoding/)

### Platform Resources

- GitHub Issues: [Report bugs](https://github.com/yourusername/orderchop/issues)
- Email Support: support@yourplatform.com
- Documentation: [Full docs](https://docs.yourplatform.com)

---

## License

[Your License Here]

---

**Last Updated**: 2025-11-10

**Version**: 1.0.0
