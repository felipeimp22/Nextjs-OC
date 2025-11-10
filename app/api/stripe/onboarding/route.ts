import { NextRequest, NextResponse } from 'next/server';
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import { auth } from '@/lib/auth';
import prisma  from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { restaurantId } = await request.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: { restaurantId },
        },
      },
    });

    if (!user || user.restaurants.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const provider = await PaymentFactory.getProvider('stripe') as StripePaymentProvider;

    const financialSettings = await prisma.financialSettings.findUnique({
      where: { restaurantId },
    });

    let stripeAccountId = financialSettings?.stripeAccountId;

    if (!stripeAccountId) {
      const account = await provider.createExpressAccount(
        restaurant.email,
        restaurant.country
      );

      stripeAccountId = account.id;

      await prisma.financialSettings.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          currency: 'USD',
          currencySymbol: '$',
          stripeEnabled: false,
          stripeAccountId,
          stripeConnectStatus: 'pending',
          paymentProvider: 'stripe',
        },
        update: {
          stripeAccountId,
          stripeConnectStatus: 'pending',
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const accountLink = await provider.createAccountLink(
      stripeAccountId,
      `${baseUrl}/api/stripe/onboarding?restaurantId=${restaurantId}`,
      `${baseUrl}/${restaurantId}/settings?tab=financial&success=stripe_onboarded`
    );

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    });
  } catch (error: any) {
    console.error('❌ Stripe onboarding failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID required' },
        { status: 400 }
      );
    }

    const provider = await PaymentFactory.getProvider('stripe') as StripePaymentProvider;

    const financialSettings = await prisma.financialSettings.findUnique({
      where: { restaurantId },
    });

    if (!financialSettings?.stripeAccountId) {
      return NextResponse.json(
        { error: 'Stripe account not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const accountLink = await provider.createAccountLink(
      financialSettings.stripeAccountId,
      `${baseUrl}/api/stripe/onboarding?restaurantId=${restaurantId}`,
      `${baseUrl}/${restaurantId}/settings?tab=financial&success=stripe_onboarded`
    );

    return NextResponse.redirect(accountLink.url);
  } catch (error: any) {
    console.error('❌ Stripe onboarding refresh failed:', error);
    return NextResponse.redirect(
      new URL(`/setup?error=onboarding_failed`, request.url)
    );
  }
}
