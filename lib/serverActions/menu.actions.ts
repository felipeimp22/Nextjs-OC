'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMenuCategories(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        items: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      itemCount: cat.items.length,
      items: undefined,
    }));

    return { success: true, data: categoriesWithCount, error: null };
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    return { success: false, error: 'Failed to fetch categories', data: null };
  }
}

export async function createMenuCategory(data: {
  restaurantId: string;
  name: string;
  description?: string;
  image?: string;
  order?: number;
  highlight?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    const category = await prisma.menuCategory.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
        image: data.image,
        order: data.order ?? 0,
        highlight: data.highlight ?? false,
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: category, error: null };
  } catch (error) {
    console.error('Error creating menu category:', error);
    return { success: false, error: 'Failed to create category', data: null };
  }
}

export async function updateMenuCategory(id: string, data: {
  restaurantId: string;
  name?: string;
  description?: string;
  image?: string;
  order?: number;
  highlight?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        order: data.order,
        highlight: data.highlight,
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: category, error: null };
  } catch (error) {
    console.error('Error updating menu category:', error);
    return { success: false, error: 'Failed to update category', data: null };
  }
}

export async function deleteMenuCategory(id: string, restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const itemCount = await prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      return { success: false, error: 'Cannot delete category with items. Please delete or move items first.', data: null };
    }

    await prisma.menuCategory.delete({
      where: { id },
    });

    revalidatePath(`/${restaurantId}/menu`);

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error deleting menu category:', error);
    return { success: false, error: 'Failed to delete category', data: null };
  }
}

export async function getMenuItems(restaurantId: string, categoryId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: items, error: null };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return { success: false, error: 'Failed to fetch items', data: null };
  }
}

export async function createMenuItem(data: {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  cost?: number;
  isAvailable?: boolean;
  isVisible?: boolean;
  allowSpecialNotes?: boolean;
  disableWhenFinishInventory?: boolean;
  inventoryCount?: number;
  tags?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    if (!data.categoryId) {
      return { success: false, error: 'Category is required', data: null };
    }

    if (data.price < 0) {
      return { success: false, error: 'Price must be a positive number', data: null };
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        image: data.image,
        price: data.price,
        cost: data.cost,
        isAvailable: data.isAvailable ?? true,
        isVisible: data.isVisible ?? true,
        allowSpecialNotes: data.allowSpecialNotes ?? false,
        disableWhenFinishInventory: data.disableWhenFinishInventory ?? false,
        inventoryCount: data.inventoryCount ?? 0,
        tags: data.tags ?? [],
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: item, error: null };
  } catch (error) {
    console.error('Error creating menu item:', error);
    return { success: false, error: 'Failed to create item', data: null };
  }
}

export async function updateMenuItem(id: string, data: {
  restaurantId: string;
  categoryId?: string;
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  cost?: number;
  isAvailable?: boolean;
  isVisible?: boolean;
  allowSpecialNotes?: boolean;
  disableWhenFinishInventory?: boolean;
  inventoryCount?: number;
  tags?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    if (data.price !== undefined && data.price < 0) {
      return { success: false, error: 'Price must be a positive number', data: null };
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        image: data.image,
        price: data.price,
        cost: data.cost,
        isAvailable: data.isAvailable,
        isVisible: data.isVisible,
        allowSpecialNotes: data.allowSpecialNotes,
        disableWhenFinishInventory: data.disableWhenFinishInventory,
        inventoryCount: data.inventoryCount,
        tags: data.tags,
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: item, error: null };
  } catch (error) {
    console.error('Error updating menu item:', error);
    return { success: false, error: 'Failed to update item', data: null };
  }
}

export async function deleteMenuItem(id: string, restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    revalidatePath(`/${restaurantId}/menu`);

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { success: false, error: 'Failed to delete item', data: null };
  }
}

export async function getOptionCategories(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const categories = await prisma.optionCategory.findMany({
      where: { restaurantId },
      include: {
        options: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      optionCount: cat.options.length,
      options: undefined,
    }));

    return { success: true, data: categoriesWithCount, error: null };
  } catch (error) {
    console.error('Error fetching option categories:', error);
    return { success: false, error: 'Failed to fetch option categories', data: null };
  }
}

export async function createOptionCategory(data: {
  restaurantId: string;
  name: string;
  description?: string;
  order?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    const category = await prisma.optionCategory.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
        order: data.order ?? 0,
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: category, error: null };
  } catch (error) {
    console.error('Error creating option category:', error);
    return { success: false, error: 'Failed to create option category', data: null };
  }
}

export async function updateOptionCategory(id: string, data: {
  restaurantId: string;
  name?: string;
  description?: string;
  order?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const category = await prisma.optionCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        order: data.order,
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: category, error: null };
  } catch (error) {
    console.error('Error updating option category:', error);
    return { success: false, error: 'Failed to update option category', data: null };
  }
}

export async function deleteOptionCategory(id: string, restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const optionCount = await prisma.option.count({
      where: { categoryId: id },
    });

    if (optionCount > 0) {
      return { success: false, error: 'Cannot delete category with options. Please delete options first.', data: null };
    }

    await prisma.optionCategory.delete({
      where: { id },
    });

    revalidatePath(`/${restaurantId}/menu`);

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error deleting option category:', error);
    return { success: false, error: 'Failed to delete option category', data: null };
  }
}

export async function getOptions(restaurantId: string, categoryId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const options = await prisma.option.findMany({
      where: {
        restaurantId,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: options, error: null };
  } catch (error) {
    console.error('Error fetching options:', error);
    return { success: false, error: 'Failed to fetch options', data: null };
  }
}

export async function createOption(data: {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  choices: Array<{
    name: string;
    basePrice: number;
    useNewPrice?: boolean;
    isDefault?: boolean;
    isAvailable?: boolean;
  }>;
  multiSelect?: boolean;
  minSelections?: number;
  maxSelections?: number;
  allowQuantity?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  isAvailable?: boolean;
  isVisible?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    if (!data.categoryId) {
      return { success: false, error: 'Category is required', data: null };
    }

    if (!data.choices || data.choices.length === 0) {
      return { success: false, error: 'At least one choice is required', data: null };
    }

    const option = await prisma.option.create({
      data: {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        image: data.image,
        choices: data.choices.map(choice => ({
          id: crypto.randomUUID(),
          name: choice.name,
          basePrice: choice.basePrice,
          useNewPrice: choice.useNewPrice ?? false,
          isDefault: choice.isDefault ?? false,
          isAvailable: choice.isAvailable ?? true,
          disableWhenFinishInventory: false,
          inventoryCount: 0,
        })),
        multiSelect: data.multiSelect ?? false,
        minSelections: data.minSelections ?? 1,
        maxSelections: data.maxSelections ?? 1,
        allowQuantity: data.allowQuantity ?? false,
        minQuantity: data.minQuantity ?? 0,
        maxQuantity: data.maxQuantity ?? 1,
        isAvailable: data.isAvailable ?? true,
        isVisible: data.isVisible ?? true,
      },
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: option, error: null };
  } catch (error) {
    console.error('Error creating option:', error);
    return { success: false, error: 'Failed to create option', data: null };
  }
}

export async function updateOption(id: string, data: {
  restaurantId: string;
  categoryId?: string;
  name?: string;
  description?: string;
  image?: string;
  choices?: Array<{
    id?: string;
    name: string;
    basePrice: number;
    useNewPrice?: boolean;
    isDefault?: boolean;
    isAvailable?: boolean;
  }>;
  multiSelect?: boolean;
  minSelections?: number;
  maxSelections?: number;
  allowQuantity?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  isAvailable?: boolean;
  isVisible?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const updateData: any = {};

    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.multiSelect !== undefined) updateData.multiSelect = data.multiSelect;
    if (data.minSelections !== undefined) updateData.minSelections = data.minSelections;
    if (data.maxSelections !== undefined) updateData.maxSelections = data.maxSelections;
    if (data.allowQuantity !== undefined) updateData.allowQuantity = data.allowQuantity;
    if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity;
    if (data.maxQuantity !== undefined) updateData.maxQuantity = data.maxQuantity;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    if (data.choices !== undefined) {
      updateData.choices = data.choices.map(choice => ({
        id: choice.id || crypto.randomUUID(),
        name: choice.name,
        basePrice: choice.basePrice,
        useNewPrice: choice.useNewPrice ?? false,
        isDefault: choice.isDefault ?? false,
        isAvailable: choice.isAvailable ?? true,
        disableWhenFinishInventory: false,
        inventoryCount: 0,
      }));
    }

    const option = await prisma.option.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/${data.restaurantId}/menu`);

    return { success: true, data: option, error: null };
  } catch (error) {
    console.error('Error updating option:', error);
    return { success: false, error: 'Failed to update option', data: null };
  }
}

export async function deleteOption(id: string, restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    await prisma.option.delete({
      where: { id },
    });

    revalidatePath(`/${restaurantId}/menu`);

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error deleting option:', error);
    return { success: false, error: 'Failed to delete option', data: null };
  }
}

// Upload Images
export async function uploadMenuImage(restaurantId: string, imageFile: {
  data: string;
  mimeType: string;
  fileName: string;
}, type: 'category' | 'item' | 'option') {
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

    const base64Data = imageFile.data.includes(',')
      ? imageFile.data.split(',')[1]
      : imageFile.data;

    const buffer = Buffer.from(base64Data, 'base64');

    const fileExtension = imageFile.mimeType.split('/')[1]?.split('+')[0] || 'png';
    const hash = crypto.randomBytes(8).toString('hex');
    const fileName = `${type}-${hash}.${fileExtension}`;
    const folder = `${restaurantId}/menu/${type === 'category' ? 'categories' : type === 'item' ? 'items' : 'options'}`;

    const uploadResult = await storage.upload({
      file: buffer,
      fileName,
      mimeType: imageFile.mimeType,
      folder,
    });

    return { success: true, data: { url: uploadResult.url }, error: null };
  } catch (error) {
    console.error(`Error uploading ${type} image:`, error);
    return { success: false, error: 'Failed to upload image', data: null };
  }
}
