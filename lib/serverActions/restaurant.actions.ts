'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Types
interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRestaurantData {
  name: string;
  address: string;
  phone: string;
}

// Get all restaurants for current user
export async function getRestaurants() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Example: Fetch from database
    // const restaurants = await prisma.restaurant.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { createdAt: 'desc' },
    // });

    // Mock data for now
    const restaurants = [
      {
        id: '1',
        name: 'Example Restaurant',
        address: '123 Main St, San Francisco, CA',
        phone: '(555) 123-4567',
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return { success: true, data: restaurants, error: null };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return { success: false, error: 'Failed to fetch restaurants', data: null };
  }
}

// Get single restaurant
export async function getRestaurant(id: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Example: Fetch from database
    // const restaurant = await prisma.restaurant.findUnique({
    //   where: { 
    //     id,
    //     userId: session.user.id, // Ensure user owns this restaurant
    //   },
    // });

    // if (!restaurant) {
    //   return { success: false, error: 'Restaurant not found', data: null };
    // }

    // Mock data for now
    const restaurant = {
      id,
      name: 'Example Restaurant',
      address: '123 Main St, San Francisco, CA',
      phone: '(555) 123-4567',
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return { success: false, error: 'Failed to fetch restaurant', data: null };
  }
}

// Create new restaurant
export async function createRestaurant(data: CreateRestaurantData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Validation
    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    if (!data.address?.trim()) {
      return { success: false, error: 'Address is required', data: null };
    }

    if (!data.phone?.trim()) {
      return { success: false, error: 'Phone is required', data: null };
    }

    // Example: Create in database
    // const restaurant = await prisma.restaurant.create({
    //   data: {
    //     name: data.name,
    //     address: data.address,
    //     phone: data.phone,
    //     userId: session.user.id,
    //   },
    // });

    // Mock response
    const restaurant = {
      id: Date.now().toString(),
      name: data.name,
      address: data.address,
      phone: data.phone,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Revalidate the restaurants list page
    revalidatePath('/dashboard/restaurants');
    
    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return { success: false, error: 'Failed to create restaurant', data: null };
  }
}

// Update restaurant
export async function updateRestaurant(id: string, data: Partial<CreateRestaurantData>) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Example: Update in database
    // const restaurant = await prisma.restaurant.update({
    //   where: { 
    //     id,
    //     userId: session.user.id, // Ensure user owns this restaurant
    //   },
    //   data: {
    //     ...(data.name && { name: data.name }),
    //     ...(data.address && { address: data.address }),
    //     ...(data.phone && { phone: data.phone }),
    //   },
    // });

    // Mock response
    const restaurant = {
      id,
      name: data.name || 'Example Restaurant',
      address: data.address || '123 Main St',
      phone: data.phone || '(555) 123-4567',
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Revalidate pages
    revalidatePath('/dashboard/restaurants');
    revalidatePath(`/dashboard/restaurants/${id}`);
    
    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return { success: false, error: 'Failed to update restaurant', data: null };
  }
}

// Delete restaurant
export async function deleteRestaurant(id: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Example: Delete from database
    // await prisma.restaurant.delete({
    //   where: { 
    //     id,
    //     userId: session.user.id, // Ensure user owns this restaurant
    //   },
    // });

    // Revalidate the restaurants list page
    revalidatePath('/dashboard/restaurants');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return { success: false, error: 'Failed to delete restaurant' };
  }
}

// Get restaurant stats (example)
export async function getRestaurantStats(restaurantId: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Example: Get stats from database
    // const stats = await prisma.order.aggregate({
    //   where: {
    //     restaurantId,
    //     createdAt: {
    //       gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    //     },
    //   },
    //   _sum: { total: true },
    //   _count: true,
    // });

    // Mock stats
    const stats = {
      totalSales: 12543.00,
      totalOrders: 856,
      newCustomers: 143,
      averageOrderValue: 34.21,
      aiPhoneOrders: 127,
      todayOrders: 36,
      avgFulfillmentTime: 18,
      topSellingItem: 'Margherita Pizza',
    };

    return { success: true, data: stats, error: null };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: 'Failed to fetch stats', data: null };
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
    }));

    return { success: true, restaurants };
  } catch (error) {
    console.error("Get restaurants error:", error);
    return { success: false, restaurants: [] };
  }
}