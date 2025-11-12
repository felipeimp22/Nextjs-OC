import { NextRequest, NextResponse } from 'next/server';
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import prisma  from '@/lib/prisma';

import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    console.log('📨 Webhook received:', {
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const provider = await PaymentFactory.getProvider('stripe') as StripePaymentProvider;

    let event: Stripe.Event;
    try {
      // @ts-expect-error -- stripe types are incorrect, To Do: fix it later 
      event = provider.verifyWebhook({
        payload: body,
        signature,
      }) as Stripe.Event;
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`🔔 Stripe webhook verified: ${event.type}`, {
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

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

  console.log('💳 Processing payment_intent.succeeded:', {
    paymentIntentId: paymentIntent.id,
    orderId,
    restaurantId,
    amount: paymentIntent.amount / 100,
    applicationFee: (paymentIntent.application_fee_amount || 0) / 100,
  });

  if (!orderId) {
    console.warn('⚠️ Payment intent succeeded but no order_id in metadata');
    return;
  }

  try {
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    });

    console.log(`✅ Order ${updatedOrder.orderNumber} marked as paid`);

    // Create transaction record
    const applicationFee = paymentIntent.application_fee_amount || 0;

    const transaction = await prisma.transaction.create({
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
      // @ts-expect-error -- metadata types are incorrect, To Do: fix it later 
        metadata: {
          currency: paymentIntent.currency,
          paymentMethod: paymentIntent.payment_method,
        },
      },
    });

    console.log(`✅ Transaction created:`, {
      transactionId: transaction.id,
      amount: transaction.amount,
      platformFee: transaction.platformFee,
      restaurantAmount: transaction.restaurantAmount,
    });
  } catch (error: any) {
    console.error(`❌ Failed to process payment for order ${orderId}:`, error.message);
    throw error;
  }
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
