export interface UploadOptions {
  folder: string;
  fileName: string;
  contentType: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface DeleteOptions {
  key: string;
}

export interface StorageProvider {
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(options: DeleteOptions): Promise<void>;
  getUrl(key: string): string;
}

export type StorageProviderType = 'wasabi' | 's3' | 'cloudinary';
