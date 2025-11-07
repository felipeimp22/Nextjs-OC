import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/serverActions/auth.actions';

export async function GET(request: NextRequest) {
  try {
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    const settings = await prisma.deliverySettings.findUnique({
      where: { restaurantId },
    });

    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, ...data } = body;

    const settings = await prisma.deliverySettings.upsert({
      where: { restaurantId },
      update: data,
      create: {
        restaurantId,
        ...data,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving delivery settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
