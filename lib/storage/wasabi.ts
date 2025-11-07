import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider, UploadOptions, UploadResult, DeleteOptions } from './types';

export class WasabiStorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint: string;

  constructor() {
    const accessKeyId = process.env.WASABI_ACCESS_KEY_ID;
    const secretAccessKey = process.env.WASABI_SECRET_ACCESS_KEY;
    const bucket = process.env.WASABI_BUCKET;
    const region = process.env.WASABI_REGION || 'us-east-1';
    const endpoint = process.env.WASABI_ENDPOINT || `https://s3.${region}.wasabisys.com`;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('Wasabi credentials not configured');
    }

    this.bucket = bucket;
    this.region = region;
    this.endpoint = endpoint;

    this.client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = `${options.folder}/${options.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: options.contentType,
    });

    await this.client.send(command);

    return {
      url: this.getUrl(key),
      key,
    };
  }

  async delete(options: DeleteOptions): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
    });

    await this.client.send(command);
  }

  getUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
