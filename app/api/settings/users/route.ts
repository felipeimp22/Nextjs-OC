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

    // Get restaurant users
    const users = await prisma.restaurantUser.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get role permissions
    const rolePermissions = await prisma.rolePermissions.findMany({
      where: { restaurantId },
    });

    return NextResponse.json({
      users: users.map((ru) => ({
        id: ru.user.id,
        name: ru.user.name,
        email: ru.user.email,
        role: ru.role,
        status: 'active',
      })),
      rolePermissions: rolePermissions.map((rp) => ({
        role: rp.role,
        permissions: rp.permissions,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
