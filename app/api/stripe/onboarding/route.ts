import { NextRequest, NextResponse } from 'next/server';
import { PaymentFactory } from '@/lib/payment/PaymentFactory';
import { StripePaymentProvider } from '@/lib/payment/providers/StripePaymentProvider';
import { auth } from '@/lib/auth';
import prisma  from '@/lib/prisma';

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
