'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface FeaturedItemInput {
  type: 'item' | 'category';
  itemId?: string;
  categoryId?: string;
}

interface SpecialItemInput {
  id?: string;
  type: 'item' | 'category' | 'custom';
  itemId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  image?: string;
  ctaText?: string;
  order?: number;
}

interface UpdateStoreConfigInput {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  featuredItemsEnabled?: boolean;
  featuredItemsTitle?: string;
  featuredItems?: FeaturedItemInput[];
  specialsEnabled?: boolean;
  specialsTitle?: string;
  specialItems?: SpecialItemInput[];
}

export async function getStoreConfig(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        restaurants: {
          where: { restaurantId },
        }
      }
    });

    if (!user || user.restaurants.length === 0) {
      return { success: false, error: 'Unauthorized access to restaurant', data: null };
    }

    let storeConfig = await prisma.storeConfig.findUnique({
      where: { restaurantId },
    });

    // Create default config if it doesn't exist
    if (!storeConfig) {
      storeConfig = await prisma.storeConfig.create({
        data: {
          restaurantId,
          featuredItemsEnabled: true,
          specialsEnabled: true,
          featuredItems: [],
          specialItems: [],
        },
      });
    }

    return { success: true, data: storeConfig, error: null };
  } catch (error) {
    console.error('Error fetching store config:', error);
    return { success: false, error: 'Failed to fetch store config', data: null };
  }
}

export async function updateStoreConfig(restaurantId: string, data: UpdateStoreConfigInput) {
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
      return { success: false, error: 'Unauthorized to update this restaurant', data: null };
    }

    // Check if config exists, create if not
    let storeConfig = await prisma.storeConfig.findUnique({
      where: { restaurantId },
    });

    const updateData: any = {};

    // SEO fields
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.metaKeywords !== undefined) updateData.metaKeywords = data.metaKeywords;
    if (data.ogImage !== undefined) updateData.ogImage = data.ogImage;

    // Featured items
    if (data.featuredItemsEnabled !== undefined) updateData.featuredItemsEnabled = data.featuredItemsEnabled;
    if (data.featuredItemsTitle !== undefined) updateData.featuredItemsTitle = data.featuredItemsTitle;
    if (data.featuredItems !== undefined) updateData.featuredItems = data.featuredItems;

    // Special items (carousel)
    if (data.specialsEnabled !== undefined) updateData.specialsEnabled = data.specialsEnabled;
    if (data.specialsTitle !== undefined) updateData.specialsTitle = data.specialsTitle;
    if (data.specialItems !== undefined) {
      // Ensure each special item has an ID
      updateData.specialItems = data.specialItems.map((item, index) => ({
        id: item.id || crypto.randomUUID(),
        type: item.type,
        itemId: item.itemId,
        categoryId: item.categoryId,
        title: item.title,
        description: item.description,
        image: item.image,
        ctaText: item.ctaText,
        order: item.order ?? index,
      }));
    }

    if (storeConfig) {
      storeConfig = await prisma.storeConfig.update({
        where: { restaurantId },
        data: updateData,
      });
    } else {
      storeConfig = await prisma.storeConfig.create({
        data: {
          restaurantId,
          ...updateData,
        },
      });
    }

    revalidatePath(`/${restaurantId}/settings`);
    revalidatePath(`/${restaurantId}/store`);

    return { success: true, data: storeConfig, error: null };
  } catch (error) {
    console.error('Error updating store config:', error);
    return { success: false, error: 'Failed to update store config', data: null };
  }
}

export async function getPublicStoreConfig(restaurantId: string) {
  try {
    const storeConfig = await prisma.storeConfig.findUnique({
      where: { restaurantId },
    });

    if (!storeConfig) {
      return {
        success: true,
        data: {
          featuredItemsEnabled: true,
          specialsEnabled: true,
          featuredItems: [],
          specialItems: [],
        },
        error: null
      };
    }

    return { success: true, data: storeConfig, error: null };
  } catch (error) {
    console.error('Error fetching public store config:', error);
    return { success: false, error: 'Failed to fetch store config', data: null };
  }
}
