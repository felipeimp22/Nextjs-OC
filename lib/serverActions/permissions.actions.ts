'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function getUserPermissions(restaurantId: string) {
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

    const userRestaurant = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId,
        userId: user.id
      }
    });

    if (!userRestaurant) {
      return { success: false, error: 'No access to restaurant', data: null };
    }

    // Owner has full access
    if (userRestaurant.role === 'owner') {
      return {
        success: true,
        data: {
          role: 'owner',
          permissions: {
            dashboard: true,
            menuManagement: true,
            orders: true,
            kitchen: true,
            customers: true,
            marketing: true,
            analytics: true,
            settings: true,
          }
        },
        error: null
      };
    }

    // Get role permissions from database
    const rolePermissions = await prisma.rolePermissions.findUnique({
      where: {
        restaurantId_role: {
          restaurantId,
          role: userRestaurant.role
        }
      }
    });

    // If no custom permissions set, use defaults based on role
    if (!rolePermissions) {
      const defaultPermissions = getDefaultPermissions(userRestaurant.role);
      return {
        success: true,
        data: {
          role: userRestaurant.role,
          permissions: defaultPermissions
        },
        error: null
      };
    }

    return {
      success: true,
      data: {
        role: userRestaurant.role,
        permissions: {
          dashboard: rolePermissions.dashboard,
          menuManagement: rolePermissions.menuManagement,
          orders: rolePermissions.orders,
          kitchen: rolePermissions.kitchen,
          customers: rolePermissions.customers,
          marketing: rolePermissions.marketing,
          analytics: rolePermissions.analytics,
          settings: rolePermissions.settings,
        }
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return { success: false, error: 'Failed to fetch permissions', data: null };
  }
}

function getDefaultPermissions(role: string) {
  const defaults: Record<string, any> = {
    manager: {
      dashboard: true,
      menuManagement: true,
      orders: true,
      kitchen: true,
      customers: true,
      marketing: true,
      analytics: true,
      settings: true,
    },
    kitchen: {
      dashboard: true,
      menuManagement: false,
      orders: true,
      kitchen: true,
      customers: false,
      marketing: false,
      analytics: false,
      settings: false,
    },
    staff: {
      dashboard: true,
      menuManagement: false,
      orders: true,
      kitchen: false,
      customers: true,
      marketing: false,
      analytics: false,
      settings: false,
    }
  };

  return defaults[role] || {
    dashboard: true,
    menuManagement: false,
    orders: false,
    kitchen: false,
    customers: false,
    marketing: false,
    analytics: false,
    settings: false,
  };
}
