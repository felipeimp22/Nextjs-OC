import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/serverActions/auth.actions';

export async function POST(request: NextRequest) {
  try {
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, rolePermissions } = body;

    // Update or create role permissions
    for (const rp of rolePermissions) {
      await prisma.rolePermissions.upsert({
        where: {
          restaurantId_role: {
            restaurantId,
            role: rp.role,
          },
        },
        update: {
          permissions: rp.permissions,
        },
        create: {
          restaurantId,
          role: rp.role,
          permissions: rp.permissions,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving permissions:', error);
    return NextResponse.json(
      { error: 'Failed to save permissions' },
      { status: 500 }
    );
  }
}
