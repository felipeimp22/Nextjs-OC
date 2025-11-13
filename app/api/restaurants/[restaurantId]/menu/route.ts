import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menuItems: {
          where: {
            isAvailable: true,
            isVisible: true,
          },
          orderBy: { name: 'asc' },
        },
        options: {
          where: {
            isAvailable: true,
            isVisible: true,
          },
        },
        menuRules: true,
        financialSettings: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      menuItems: restaurant.menuItems,
      options: restaurant.options,
      menuRules: restaurant.menuRules,
      currencySymbol: restaurant.financialSettings?.currencySymbol || '$',
    });
  } catch (error: any) {
    console.error('Error fetching restaurant menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
