'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Financial Settings
export async function getFinancialSettings(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const settings = await prisma.financialSettings.findUnique({
      where: { restaurantId },
    });

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error fetching financial settings:', error);
    return { success: false, error: 'Failed to fetch settings', data: null };
  }
}

export async function updateFinancialSettings(restaurantId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Verify user has access to this restaurant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: {
            restaurantId,
            role: { in: ['owner', 'manager'] }
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const settings = await prisma.financialSettings.upsert({
      where: { restaurantId },
      update: data,
      create: {
        restaurantId,
        ...data,
      },
    });

    revalidatePath(`/${restaurantId}/settings`);
    revalidatePath(`/${restaurantId}/settings/financial`);

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error updating financial settings:', error);
    return { success: false, error: 'Failed to save settings', data: null };
  }
}

// Delivery Settings
export async function getDeliverySettings(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const settings = await prisma.deliverySettings.findUnique({
      where: { restaurantId },
    });

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return { success: false, error: 'Failed to fetch settings', data: null };
  }
}

export async function updateDeliverySettings(restaurantId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: {
            restaurantId,
            role: { in: ['owner', 'manager'] }
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const settings = await prisma.deliverySettings.upsert({
      where: { restaurantId },
      update: data,
      create: {
        restaurantId,
        ...data,
      },
    });

    revalidatePath(`/${restaurantId}/settings`);
    revalidatePath(`/${restaurantId}/settings/delivery`);

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return { success: false, error: 'Failed to save settings', data: null };
  }
}

// Store Hours
export async function getStoreHours(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const settings = await prisma.storeHours.findUnique({
      where: { restaurantId },
    });

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error fetching store hours:', error);
    return { success: false, error: 'Failed to fetch settings', data: null };
  }
}

export async function updateStoreHours(restaurantId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: {
            restaurantId,
            role: { in: ['owner', 'manager'] }
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const settings = await prisma.storeHours.upsert({
      where: { restaurantId },
      update: data,
      create: {
        restaurantId,
        ...data,
      },
    });

    revalidatePath(`/${restaurantId}/settings`);
    revalidatePath(`/${restaurantId}/settings/hours`);

    return { success: true, data: settings, error: null };
  } catch (error) {
    console.error('Error updating store hours:', error);
    return { success: false, error: 'Failed to save settings', data: null };
  }
}

// Users and Permissions
export async function getRestaurantUsers(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const users = await prisma.userRestaurant.findMany({
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

    const rolePermissions = await prisma.rolePermissions.findMany({
      where: { restaurantId },
    });

    // Simple 1:1 mapping - page name to permission field
    const mappedPermissions = rolePermissions.map((rp) => ({
      role: rp.role,
      permissions: {
        dashboard: rp.dashboard,
        menu: rp.menuManagement,
        orders: rp.orders,
        kitchen: rp.kitchen,
        customers: rp.customers,
        marketing: rp.marketing,
        analytics: rp.analytics,
        settings: rp.settings,
      },
    }));

    return {
      success: true,
      data: {
        users: users.map((ru) => ({
          id: ru.user.id,
          name: ru.user.name,
          email: ru.user.email,
          role: ru.role,
          status: 'active',
        })),
        rolePermissions: mappedPermissions,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users', data: null };
  }
}

export async function updateRolePermissions(restaurantId: string, rolePermissions: any[]) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: {
            restaurantId,
            role: 'owner' // Only owners can modify permissions
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Only owners can modify permissions' };
    }

    // Simple 1:1 mapping - frontend to backend
    for (const rp of rolePermissions) {
      const permissionData = {
        dashboard: rp.permissions.dashboard || false,
        menuManagement: rp.permissions.menu || false,
        orders: rp.permissions.orders || false,
        kitchen: rp.permissions.kitchen || false,
        customers: rp.permissions.customers || false,
        marketing: rp.permissions.marketing || false,
        analytics: rp.permissions.analytics || false,
        settings: rp.permissions.settings || false,
      };

      await prisma.rolePermissions.upsert({
        where: {
          restaurantId_role: {
            restaurantId,
            role: rp.role,
          },
        },
        update: permissionData,
        create: {
          restaurantId,
          role: rp.role,
          ...permissionData,
        },
      });
    }

    revalidatePath(`/${restaurantId}/settings`);
    revalidatePath(`/${restaurantId}/settings/users`);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating permissions:', error);
    return { success: false, error: 'Failed to save permissions' };
  }
}

// Upload photo
export async function uploadRestaurantPhoto(restaurantId: string, logoFile: {
  data: string;
  mimeType: string;
  fileName: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: {
            restaurantId,
            role: { in: ['owner', 'manager'] }
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const { StorageFactory } = await import("@/lib/storage");
    const crypto = await import("crypto");

    const storage = StorageFactory.getProvider();
    const base64Data = logoFile.data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileExtension = logoFile.mimeType.split('/')[1];
    const hash = crypto.randomBytes(8).toString('hex');
    const fileName = `logo-${hash}.${fileExtension}`;
    const folder = `${restaurantId}/restaurant`;

    const uploadResult = await storage.upload({
      file: buffer,
      fileName,
      mimeType: logoFile.mimeType,
      folder,
    });

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { logo: uploadResult.url },
    });

    revalidatePath(`/${restaurantId}/settings`);

    return { success: true, data: { url: uploadResult.url }, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error: 'Failed to upload photo', data: null };
  }
}
