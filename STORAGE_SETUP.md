# Storage Integration Setup

This project uses a modular storage system that supports multiple bucket providers. Currently, Wasabi is implemented, but the architecture allows easy switching to other providers like AWS S3 or Cloudinary.

## Architecture

The storage system follows SOLID principles with a clear separation of concerns:

- **Interface Layer** (`lib/storage/types.ts`): Defines the contract that all storage providers must implement
- **Implementation Layer** (`lib/storage/wasabi.ts`): Provider-specific implementation
- **Factory Layer** (`lib/storage/index.ts`): Creates and returns the appropriate storage provider

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# Storage Provider Configuration
STORAGE_PROVIDER=wasabi

# Wasabi Credentials
WASABI_ACCESS_KEY_ID=your_access_key_id
WASABI_SECRET_ACCESS_KEY=your_secret_access_key
WASABI_BUCKET=your_bucket_name
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

### Getting Wasabi Credentials

1. Sign up at [Wasabi Console](https://console.wasabisys.com/)
2. Create a bucket in your desired region
3. Generate Access Keys under "Access Keys" section
4. Copy the credentials to your `.env.local` file

### Region and Endpoint Configuration

Common Wasabi regions and endpoints:

- **US East 1**: `https://s3.us-east-1.wasabisys.com`
- **US East 2**: `https://s3.us-east-2.wasabisys.com`
- **US West 1**: `https://s3.us-west-1.wasabisys.com`
- **EU Central 1**: `https://s3.eu-central-1.wasabisys.com`
- **AP Northeast 1**: `https://s3.ap-northeast-1.wasabisys.com`

## File Storage Structure

Images are stored with the following structure:

```
<restaurant_ID>/restaurant/<filename>-<hash>.<extension>
```

Example: `507f1f77bcf86cd799439011/restaurant/logo-a3b2c1d4.png`

## Usage in the Application

### Restaurant Logo Upload

The system is integrated into the restaurant setup flow:

1. User fills out restaurant information
2. User uploads a logo (optional)
3. Restaurant is created in the database
4. If a logo was selected, it's uploaded to Wasabi
5. Restaurant record is updated with the logo URL

### API Endpoint

**POST** `/api/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: The image file (max 5MB)
  - `restaurantId`: The restaurant ID
  - `folder`: The folder name (default: 'restaurant')

**Response:**
```json
{
  "success": true,
  "url": "https://s3.us-east-1.wasabisys.com/bucket/restaurant_id/restaurant/logo-hash.png",
  "key": "restaurant_id/restaurant/logo-hash.png"
}
```

**Supported File Types:**
- JPEG/JPG
- PNG
- WebP

**File Size Limit:** 5MB

## Adding Other Storage Providers

To add support for another storage provider (e.g., AWS S3, Cloudinary):

1. Create a new file in `lib/storage/` (e.g., `s3.ts`, `cloudinary.ts`)
2. Implement the `StorageProvider` interface
3. Add the provider to the factory in `lib/storage/index.ts`
4. Update the `StorageProviderType` in `lib/storage/types.ts`
5. Set the `STORAGE_PROVIDER` environment variable

### Example: Adding AWS S3

```typescript
// lib/storage/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider, UploadOptions, UploadResult, DeleteOptions } from './types';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_BUCKET!;
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = `${options.folder}/${options.fileName}`;

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: options.contentType,
    }));

    return {
      url: this.getUrl(key),
      key,
    };
  }

  async delete(options: DeleteOptions): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
    }));
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
```

Then update `lib/storage/index.ts`:

```typescript
case 's3':
  storageProviderInstance = new S3StorageProvider();
  break;
```

## Security Considerations

- Never commit `.env.local` to version control
- Use bucket policies to restrict public access
- Implement file type validation (already included)
- Enforce file size limits (already included)
- Consider adding virus scanning for production environments
- Use signed URLs for private content if needed

## Testing

To test the storage integration:

1. Set up your Wasabi credentials in `.env.local`
2. Start the development server: `npm run dev`
3. Navigate to the restaurant setup page
4. Create a new restaurant with a logo
5. Verify the image appears in your Wasabi bucket
6. Verify the logo displays correctly in the restaurant list

## Troubleshooting

### "Wasabi credentials not configured" Error

Ensure all required environment variables are set in `.env.local`:
- `WASABI_ACCESS_KEY_ID`
- `WASABI_SECRET_ACCESS_KEY`
- `WASABI_BUCKET`

### Upload Fails with 403 Error

Check that your Wasabi access key has write permissions to the bucket.

### Image Not Displaying

Verify that your bucket has public read access enabled for the uploaded files, or adjust the bucket policy accordingly.
