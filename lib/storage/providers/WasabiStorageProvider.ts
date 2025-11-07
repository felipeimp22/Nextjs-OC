import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  IStorageProvider,
  UploadOptions,
  UploadResult,
} from '../interfaces/IStorageProvider';

export interface WasabiConfig {
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
}

export class WasabiStorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(config: WasabiConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;

    this.client = new S3Client({
      endpoint: `https://${config.endpoint}`,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const key = `${options.folder}/${options.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: options.file,
      ContentType: options.mimeType,
      ACL: 'public-read',
    });

    await this.client.send(command);

    return {
      url: this.getUrl(key),
      key,
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  getUrl(key: string): string {
    return `https://${this.endpoint}/${this.bucket}/${key}`;
  }
}
