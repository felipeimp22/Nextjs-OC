import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStorageProvider } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const restaurantId = formData.get('restaurantId') as string;
    const folder = formData.get('folder') as string || 'restaurant';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const fileName = `${sanitizedName}-${hash}.${extension}`;

    const storageProvider = getStorageProvider();
    const result = await storageProvider.upload(buffer, {
      folder: `${restaurantId}/${folder}`,
      fileName,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
