import { NextRequest, NextResponse } from 'next/server';
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import prisma  from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Stripe Connect OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/setup?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    const { restaurantId } = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const provider = await PaymentFactory.getProvider('stripe') as StripePaymentProvider;

    const connectData = await provider.completeConnectOAuth(code);

    const accountDetails = await provider.getConnectedAccount(connectData.stripeUserId);

    await prisma.financialSettings.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        currency: 'USD',
        currencySymbol: '$',
        stripeEnabled: true,
        stripeAccountId: connectData.stripeUserId,
        stripePublicKey: connectData.publishableKey,
        stripeConnectStatus: accountDetails.charges_enabled ? 'connected' : 'pending',
        stripeConnectDetails: {
          accessToken: connectData.accessToken,
          refreshToken: connectData.refreshToken,
          accountType: accountDetails.type,
          chargesEnabled: accountDetails.charges_enabled,
          payoutsEnabled: accountDetails.payouts_enabled,
        },
        paymentProvider: 'stripe',
      },
      update: {
        stripeEnabled: true,
        stripeAccountId: connectData.stripeUserId,
        stripePublicKey: connectData.publishableKey,
        stripeConnectStatus: accountDetails.charges_enabled ? 'connected' : 'pending',
        stripeConnectDetails: {
          accessToken: connectData.accessToken,
          refreshToken: connectData.refreshToken,
          accountType: accountDetails.type,
          chargesEnabled: accountDetails.charges_enabled,
          payoutsEnabled: accountDetails.payouts_enabled,
        },
        paymentProvider: 'stripe',
      },
    });

    console.log(`✅ Stripe Connect completed for restaurant ${restaurantId}`);

    return NextResponse.redirect(
      new URL(`/${restaurantId}/settings?tab=financial&success=stripe_connected`, request.url)
    );
  } catch (error: any) {
    console.error('❌ Stripe Connect OAuth failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete OAuth' },
      { status: 500 }
    );
  }
}
