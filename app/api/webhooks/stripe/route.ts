import { NextRequest, NextResponse } from 'next/server';
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const provider = await PaymentFactory.getProvider('stripe') as StripePaymentProvider;
    const event = provider.verifyWebhook({
      payload: body,
      signature,
    }) as Stripe.Event;

    console.log(`🔔 Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeSucceeded(charge);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  const restaurantId = paymentIntent.metadata.restaurant_id;

  if (!orderId) {
    console.warn('Payment intent succeeded but no order_id in metadata');
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      status: 'confirmed',
    },
  });

  const applicationFee = paymentIntent.application_fee_amount || 0;

  await prisma.transaction.create({
    data: {
      orderId,
      restaurantId: restaurantId!,
      amount: paymentIntent.amount / 100,
      platformFee: applicationFee / 100,
      restaurantAmount: (paymentIntent.amount - applicationFee) / 100,
      paymentProvider: 'stripe',
      paymentIntentId: paymentIntent.id,
      chargeId: typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id,
      status: 'succeeded',
      testMode: paymentIntent.livemode === false,
      metadata: {
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
      },
    },
  });

  console.log(`✅ Payment intent succeeded for order ${orderId}`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;

  if (!orderId) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'failed',
    },
  });

  console.log(`❌ Payment intent failed for order ${orderId}`);
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  const orderId = charge.metadata.order_id;

  if (!orderId) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      chargeId: charge.id,
    },
  });

  console.log(`✅ Charge succeeded for order ${orderId}`);
}

async function handleAccountUpdated(account: Stripe.Account) {
  const financialSettings = await prisma.financialSettings.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (!financialSettings) {
    console.warn(`Account ${account.id} not found in database`);
    return;
  }

  const status = account.charges_enabled && account.payouts_enabled
    ? 'connected'
    : account.details_submitted
    ? 'pending'
    : 'not_connected';

  await prisma.financialSettings.update({
    where: { id: financialSettings.id },
    data: {
      stripeConnectStatus: status,
      stripeConnectDetails: {
        ...(typeof financialSettings.stripeConnectDetails === 'object' ? financialSettings.stripeConnectDetails : {}),
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
    },
  });

  console.log(`✅ Account ${account.id} updated: ${status}`);
}
