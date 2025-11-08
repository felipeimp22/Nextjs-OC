'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { StorageFactory } from "@/lib/storage";
import crypto from "crypto";

interface CreateRestaurantData {
  name: string;
  description?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone: string;
  email: string;
  logo?: string;
  logoFile?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export async function createRestaurant(data: CreateRestaurantData) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    if (!data.street?.trim() || !data.city?.trim() || !data.state?.trim() || !data.zipCode?.trim()) {
      return { success: false, error: 'Complete address is required', data: null };
    }

    if (!data.phone?.trim()) {
      return { success: false, error: 'Phone is required', data: null };
    }

    if (!data.email?.trim()) {
      return { success: false, error: 'Email is required', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: "User not found", data: null };
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        street: data.street.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        zipCode: data.zipCode.trim(),
        country: data.country || 'US',
        phone: data.phone.trim(),
        email: data.email.trim(),
        primaryColor: data.primaryColor || '#282e59',
        secondaryColor: data.secondaryColor || '#f03e42',
        accentColor: data.accentColor || '#ffffff',
      },
    });

    await prisma.userRestaurant.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        role: 'owner',
      },
    });

    // Create default financial settings with platform fee
    await prisma.financialSettings.create({
      data: {
        restaurantId: restaurant.id,
        currency: 'USD',
        currencySymbol: '$',
        globalFee: {
          enabled: true,
          threshold: 10,
          belowPercent: 10,
          aboveFlat: 1.95,
        },
      },
    });

    console.log('[DEBUG] logoFile present:', !!data.logoFile);
    console.log('[DEBUG] Environment check - WASABI_ACCESS_KEY exists:', !!process.env.WASABI_ACCESS_KEY);
    console.log('[DEBUG] Environment check - WASABI_BUCKET:', process.env.WASABI_BUCKET);

    if (data.logoFile) {
      try {
        console.log('[DEBUG] Starting logo upload for restaurant:', restaurant.id);
        console.log('[DEBUG] File type:', data.logoFile.mimeType);
        console.log('[DEBUG] File name:', data.logoFile.fileName);

        const storage = StorageFactory.getProvider();
        const base64Data = data.logoFile.data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const fileExtension = data.logoFile.mimeType.split('/')[1];
        const hash = crypto.randomBytes(8).toString('hex');
        const fileName = `logo-${hash}.${fileExtension}`;
        const folder = `${restaurant.id}/restaurant`;

        console.log('[DEBUG] Uploading to:', `${folder}/${fileName}`);

        const uploadResult = await storage.upload({
          file: buffer,
          fileName,
          mimeType: data.logoFile.mimeType,
          folder,
        });

        console.log('[DEBUG] Upload successful, URL:', uploadResult.url);

        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { logo: uploadResult.url },
        });

        console.log('[DEBUG] Database updated with logo URL');

        restaurant.logo = uploadResult.url;
      } catch (uploadError) {
        console.error('[ERROR] Error uploading logo:', uploadError);
        console.error('[ERROR] Error details:', uploadError instanceof Error ? uploadError.message : String(uploadError));
      }
    } else {
      console.log('[DEBUG] No logoFile provided in request');
    }

    revalidatePath('/dashboard');
    revalidatePath('/getting-started');

    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return { success: false, error: 'Failed to create restaurant', data: null };
  }
}

export async function getUserRestaurants() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { success: false, restaurants: [] };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!user) {
      return { success: false, restaurants: [] };
    }

    const restaurants = user.restaurants.map(ur => ({
      id: ur.restaurant.id,
      name: ur.restaurant.name,
      role: ur.role,
      street: ur.restaurant.street,
      city: ur.restaurant.city,
      state: ur.restaurant.state,
      logo: ur.restaurant.logo,
    }));

    return { success: true, restaurants };
  } catch (error) {
    console.error("Get user restaurants error:", error);
    return { success: false, restaurants: [] };
  }
}

export async function searchRestaurants(query: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    if (!query?.trim()) {
      return { success: true, data: [], error: null };
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        name: {
          contains: query.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        state: true,
        logo: true,
      },
      take: 10,
    });

    return { success: true, data: restaurants, error: null };
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return { success: false, error: 'Failed to search restaurants', data: [] };
  }
}

export async function requestRestaurantAccess(restaurantId: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const existingAccess = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: restaurantId,
        },
      },
    });

    if (existingAccess) {
      return { success: false, error: "You already have access to this restaurant" };
    }

    await prisma.userRestaurant.create({
      data: {
        userId: user.id,
        restaurantId: restaurantId,
        role: 'staff',
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/getting-started');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error requesting access:', error);
    return { success: false, error: 'Failed to request access' };
  }
}

export async function getRestaurant(id: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: { restaurantId: id },
          include: { restaurant: true }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Restaurant not found or access denied', data: null };
    }

    const restaurant = user.restaurants[0].restaurant;

    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return { success: false, error: 'Failed to fetch restaurant', data: null };
  }
}

export async function updateRestaurant(id: string, data: Partial<CreateRestaurantData>) {
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
            restaurantId: id,
            role: { in: ['owner', 'manager'] }
          }
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized to update this restaurant', data: null };
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim();
    if (data.street) updateData.street = data.street.trim();
    if (data.city) updateData.city = data.city.trim();
    if (data.state) updateData.state = data.state.trim();
    if (data.zipCode) updateData.zipCode = data.zipCode.trim();
    if (data.country) updateData.country = data.country;
    if (data.phone) updateData.phone = data.phone.trim();
    if (data.email) updateData.email = data.email.trim();
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.primaryColor) updateData.primaryColor = data.primaryColor;
    if (data.secondaryColor) updateData.secondaryColor = data.secondaryColor;
    if (data.accentColor) updateData.accentColor = data.accentColor;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/${id}`);

    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return { success: false, error: 'Failed to update restaurant', data: null };
  }
}
