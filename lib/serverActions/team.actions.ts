'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getRestaurantTeam(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found', data: null };
    }

    const userAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId,
        userId: user.id
      }
    });

    if (!userAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    const team = await prisma.userRestaurant.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: team, error: null };
  } catch (error) {
    console.error('Error fetching team:', error);
    return { success: false, error: 'Failed to fetch team', data: null };
  }
}

export async function updateUserRole(data: {
  restaurantId: string;
  userId: string;
  newRole: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found', data: null };
    }

    const managerAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!managerAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    if (managerAccess.role !== 'owner' && data.newRole === 'owner') {
      return { success: false, error: 'Only owners can assign owner role', data: null };
    }

    const targetUser = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        userId: data.userId
      }
    });

    if (!targetUser) {
      return { success: false, error: 'User not found in restaurant', data: null };
    }

    if (targetUser.role === 'owner' && managerAccess.role !== 'owner') {
      return { success: false, error: 'Only owners can change owner roles', data: null };
    }

    const updated = await prisma.userRestaurant.update({
      where: {
        userId_restaurantId: {
          userId: data.userId,
          restaurantId: data.restaurantId
        }
      },
      data: { role: data.newRole }
    });

    revalidatePath(`/${data.restaurantId}/settings`);
    return { success: true, data: updated, error: null };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: 'Failed to update role', data: null };
  }
}

export async function removeTeamMember(data: {
  restaurantId: string;
  userId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found', data: null };
    }

    const managerAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!managerAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    const targetUser = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        userId: data.userId
      }
    });

    if (!targetUser) {
      return { success: false, error: 'User not found in restaurant', data: null };
    }

    if (targetUser.role === 'owner' && managerAccess.role !== 'owner') {
      return { success: false, error: 'Only owners can remove owners', data: null };
    }

    if (data.userId === user.id) {
      return { success: false, error: 'You cannot remove yourself', data: null };
    }

    await prisma.userRestaurant.delete({
      where: {
        userId_restaurantId: {
          userId: data.userId,
          restaurantId: data.restaurantId
        }
      }
    });

    revalidatePath(`/${data.restaurantId}/settings`);
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error removing team member:', error);
    return { success: false, error: 'Failed to remove team member', data: null };
  }
}
