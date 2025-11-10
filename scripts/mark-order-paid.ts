/**
 * Manually mark an order as paid (for testing without webhooks)
 * Usage: npx tsx scripts/mark-order-paid.ts <orderNumber or orderId>
 */

import prisma from '@/lib/prisma';

async function markOrderPaid() {
  const orderIdentifier = process.argv[2];

  if (!orderIdentifier) {
    console.error('❌ Usage: npx tsx scripts/mark-order-paid.ts <orderNumber or orderId>');
    process.exit(1);
  }

  try {
    // Try to find order by number first, then by ID
    let order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: orderIdentifier },
          { id: orderIdentifier },
        ],
      },
    });

    if (!order) {
      console.error(`❌ Order not found: ${orderIdentifier}`);
      process.exit(1);
    }

    console.log('📦 Order found:', {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentStatus: order.paymentStatus,
      status: order.status,
      paymentIntentId: order.paymentIntentId,
    });

    if (order.paymentStatus === 'paid') {
      console.log('ℹ️  Order is already marked as paid');
      process.exit(0);
    }

    if (!order.paymentIntentId) {
      console.error('❌ Order has no payment intent ID');
      process.exit(1);
    }

    // Call the manual webhook test endpoint
    const response = await fetch('http://localhost:3000/api/webhooks/stripe/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId: order.paymentIntentId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to mark order as paid:', error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Success:', result.message);
    console.log('📦 Updated order:', result.order);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

markOrderPaid();
