import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Manual webhook trigger for local testing
 * POST /api/webhooks/stripe/test
 * Body: { paymentIntentId: "pi_xxx" }
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required' },
        { status: 400 }
      );
    }

    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: { paymentIntentId },
    });

    if (!order) {
      return NextResponse.json(
        { error: `No order found with paymentIntentId: ${paymentIntentId}` },
        { status: 404 }
      );
    }

    // Update order to paid
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    });

    console.log(`✅ Manually marked order ${order.orderNumber} as paid`);

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} marked as paid`,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    });
  } catch (error: any) {
    console.error('❌ Manual webhook test failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
