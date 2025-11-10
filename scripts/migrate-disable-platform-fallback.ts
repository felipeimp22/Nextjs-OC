/**
 * Migration Script: Disable Platform Account Fallback
 *
 * This script updates all existing restaurants to disable platform account fallback.
 * Payments will now always go to restaurant Stripe Connect accounts with OrderChop
 * collecting the platform fee ($1.95) as an application fee.
 *
 * Run with: npx tsx scripts/migrate-disable-platform-fallback.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting migration: Disable platform account fallback...\n');

  try {
    // Get all financial settings
    const financialSettings = await prisma.financialSettings.findMany({
      where: {
        usePlatformAccountFallback: true,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${financialSettings.length} restaurant(s) with platform fallback enabled\n`);

    if (financialSettings.length === 0) {
      console.log('✅ No restaurants need migration. All settings are up to date!');
      return;
    }

    // Update each restaurant
    let successCount = 0;
    let errorCount = 0;

    for (const settings of financialSettings) {
      try {
        await prisma.financialSettings.update({
          where: { id: settings.id },
          data: {
            usePlatformAccountFallback: false,
          },
        });

        console.log(`✅ Updated: ${settings.restaurant.name} (${settings.restaurant.id})`);

        // Check if restaurant has Stripe Connect configured
        if (!settings.stripeAccountId || settings.stripeConnectStatus !== 'connected') {
          console.log(`   ⚠️  Warning: This restaurant does not have Stripe Connect configured`);
          console.log(`   ℹ️  Restaurant will not be able to accept orders until Stripe Connect is set up\n`);
        }

        successCount++;
      } catch (error: any) {
        console.error(`❌ Error updating ${settings.restaurant.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${financialSettings.length}`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Restaurants without Stripe Connect must set up their account');
    console.log('   2. Go to Settings > Financial > Payment Provider');
    console.log('   3. Connect Stripe account to start accepting payments');
    console.log('   4. Platform fee ($1.95) will be automatically collected as application fee\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
