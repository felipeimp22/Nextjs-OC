/**
 * Quick Fix: Enable Platform Fallback for Testing
 *
 * This temporarily enables platform account fallback for existing test restaurants
 * so you can test the ordering flow while setting up Stripe Connect properly.
 *
 * Run with: npx tsx scripts/enable-platform-fallback.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Enabling platform fallback for test restaurants...\n');

  try {
    // Update all financial settings to enable platform fallback
    const result = await prisma.financialSettings.updateMany({
      where: {
        usePlatformAccountFallback: false,
      },
      data: {
        usePlatformAccountFallback: true,
      },
    });

    console.log(`✅ Updated ${result.count} restaurant(s) to use platform fallback\n`);

    console.log('⚠️  IMPORTANT: This is for TESTING ONLY!');
    console.log('📝 With platform fallback enabled:');
    console.log('   - Orders will be processed on the platform Stripe account');
    console.log('   - Restaurant will NOT receive funds directly');
    console.log('   - Platform fee will NOT be collected as application fee');
    console.log('   - You can test the order flow without Stripe Connect\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Test your order flow - it should work now');
    console.log('   2. Set up Stripe Connect for your restaurant:');
    console.log('      - Go to Settings > Financial > Payment Provider');
    console.log('      - Click "Connect Stripe Account"');
    console.log('   3. After Stripe Connect is set up, run:');
    console.log('      npx tsx scripts/migrate-disable-platform-fallback.ts');
    console.log('   4. This will ensure all payments go to restaurant accounts\n');

  } catch (error: any) {
    console.error('❌ Failed to enable platform fallback:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
