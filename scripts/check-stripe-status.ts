/**
 * Debug Script: Check Stripe Connect Status
 *
 * This script checks the current Stripe Connect status for a restaurant
 * and provides detailed information about what's configured.
 *
 * Usage: npx tsx scripts/check-stripe-status.ts <restaurantId>
 * Example: npx tsx scripts/check-stripe-status.ts 69115e62a0134886b5636ca2
 */

import { PrismaClient } from '@prisma/client';
import { PaymentFactory } from '../lib/payment/PaymentFactory';
import { StripePaymentProvider } from '../lib/payment/providers/StripePaymentProvider';

const prisma = new PrismaClient();

async function main() {
  const restaurantId = process.argv[2];

  if (!restaurantId) {
    console.error('❌ Please provide a restaurant ID');
    console.log('Usage: npx tsx scripts/check-stripe-status.ts <restaurantId>');
    process.exit(1);
  }

  console.log('🔍 Checking Stripe Connect status...\n');

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true },
    });

    if (!restaurant) {
      console.error(`❌ Restaurant not found: ${restaurantId}`);
      process.exit(1);
    }

    console.log(`📍 Restaurant: ${restaurant.name} (${restaurant.id})\n`);

    const financialSettings = await prisma.financialSettings.findUnique({
      where: { restaurantId },
    });

    if (!financialSettings) {
      console.error('❌ No financial settings found for this restaurant');
      process.exit(1);
    }

    console.log('💰 Financial Settings:');
    console.log(`   Stripe Account ID: ${financialSettings.stripeAccountId || 'NOT SET'}`);
    console.log(`   Stripe Connect Status: ${financialSettings.stripeConnectStatus}`);
    console.log(`   Platform Fallback Enabled: ${financialSettings.usePlatformAccountFallback}`);
    console.log(`   Payment Provider: ${financialSettings.paymentProvider}\n`);

    if (financialSettings.stripeAccountId) {
      console.log('🔄 Fetching live Stripe account details...\n');

      try {
        const provider = await PaymentFactory.getProvider('stripe') as StripePaymentProvider;
        const account = await provider.getConnectedAccount(financialSettings.stripeAccountId);

        console.log('✅ Stripe Account Details:');
        console.log(`   Account Type: ${account.type}`);
        console.log(`   Charges Enabled: ${account.charges_enabled ? '✅' : '❌'}`);
        console.log(`   Payouts Enabled: ${account.payouts_enabled ? '✅' : '❌'}`);
        console.log(`   Details Submitted: ${account.details_submitted ? '✅' : '❌'}`);
        console.log(`   Email: ${account.email || 'Not set'}`);
        console.log(`   Country: ${account.country}\n`);

        const expectedStatus = account.charges_enabled && account.payouts_enabled
          ? 'connected'
          : account.details_submitted
          ? 'pending'
          : 'not_connected';

        console.log(`📊 Status Analysis:`);
        console.log(`   Current DB Status: ${financialSettings.stripeConnectStatus}`);
        console.log(`   Expected Status: ${expectedStatus}`);

        if (financialSettings.stripeConnectStatus !== expectedStatus) {
          console.log(`   ⚠️  Status mismatch detected!\n`);
          console.log(`💡 Recommendation:`);
          console.log(`   Run this to update the status:`);
          console.log(`   Update FinancialSettings set stripeConnectStatus='${expectedStatus}' where restaurantId='${restaurantId}'\n`);
        } else {
          console.log(`   ✅ Status matches\n`);
        }

        if (expectedStatus === 'pending') {
          console.log(`⚠️  Account is in PENDING state:`);
          console.log(`   - Account created but onboarding not complete`);
          console.log(`   - Can process payments in test mode`);
          console.log(`   - Need to complete onboarding for production\n`);
        } else if (expectedStatus === 'connected') {
          console.log(`✅ Account is FULLY CONNECTED:`);
          console.log(`   - Can process payments`);
          console.log(`   - Platform fee will be collected as application fee\n`);
        } else {
          console.log(`❌ Account NOT CONNECTED:`);
          console.log(`   - Cannot process payments`);
          console.log(`   - Need to complete Stripe Connect onboarding\n`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to fetch Stripe account details:`, error.message);
      }
    } else {
      console.log('❌ No Stripe account connected\n');
      console.log('💡 Next Steps:');
      console.log('   1. Go to restaurant Settings > Financial');
      console.log('   2. Click "Connect Stripe Account"');
      console.log('   3. Complete Stripe Connect onboarding\n');
    }

    console.log('📋 Payment Processing Status:');
    if (financialSettings.stripeAccountId && (
      financialSettings.stripeConnectStatus === 'connected' ||
      financialSettings.stripeConnectStatus === 'pending'
    )) {
      console.log('   ✅ Can process orders (using Stripe Connect)');
    } else if (financialSettings.usePlatformAccountFallback) {
      console.log('   ⚠️  Can process orders (using platform fallback - TESTING ONLY)');
    } else {
      console.log('   ❌ Cannot process orders - needs Stripe Connect or platform fallback');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
