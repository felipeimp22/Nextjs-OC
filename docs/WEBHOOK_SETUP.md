# Stripe Webhook Setup Guide

For Stripe Connect Direct Charges, webhooks are sent to your **platform account**. This guide shows how to receive webhooks locally during development and in production.

## Quick Fix: Test Webhook Manually

While you set up proper webhooks, you can manually mark orders as paid:

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxx"}'
```

Replace `pi_xxx` with the actual Payment Intent ID from your test payment.

## Local Development Setup (Stripe CLI)

### 1. Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. Login to Stripe

```bash
stripe login
```

This will open your browser to authorize the CLI.

### 3. Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Add Webhook Secret to Environment

Copy the webhook signing secret and add it to your `.env.local`:

```env
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Restart Your Dev Server

```bash
npm run dev
```

### 6. Test a Payment

Now when you make a test payment:
1. The payment will succeed in Stripe
2. Stripe sends webhook to Stripe CLI
3. Stripe CLI forwards it to your localhost
4. Your webhook handler processes it
5. Order status updates to "paid" and "confirmed"

## Production Setup

### 1. Configure Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `account.updated`
5. Click "Add endpoint"

### 2. Get Webhook Signing Secret

After creating the endpoint, click on it to view details. You'll see the signing secret starting with `whsec_`.

### 3. Add to Production Environment

Add the secret to your production environment variables:

```env
STRIPE_LIVE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Verify Webhooks Are Working

### Check Server Logs

When a webhook is received, you should see:
```
📨 Webhook received: { hasSignature: true, bodyLength: 1234 }
🔔 Stripe webhook verified: payment_intent.succeeded
💳 Processing payment_intent.succeeded: { paymentIntentId: 'pi_xxx', orderId: '...', amount: 25.50 }
✅ Order #12345 marked as paid
✅ Transaction created: { transactionId: '...', amount: 25.50, platformFee: 1.95 }
```

### Check Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View "Logs" tab to see webhook delivery attempts

### Test Webhook Endpoint

Use Stripe CLI to send a test event:

```bash
stripe trigger payment_intent.succeeded
```

## Troubleshooting

### Webhook Signature Verification Failed

- **Cause**: Wrong webhook secret or missing `STRIPE_TEST_WEBHOOK_SECRET`
- **Fix**: Make sure the secret in `.env.local` matches the one from `stripe listen` output

### No Webhook Received

- **Local Dev**: Make sure `stripe listen` is running
- **Production**: Check webhook endpoint URL is correct and publicly accessible

### Order Still Pending

- Check server logs for webhook errors
- Verify webhook secret is configured
- Use the manual test endpoint (see Quick Fix above)

## Manual Testing During Development

If you don't want to use Stripe CLI, you can:

1. Get the Payment Intent ID after successful payment (check browser console)
2. Call the test endpoint:

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxx"}'
```

This will manually update the order status without requiring webhooks.
