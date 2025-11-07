export interface UploadOptions {
  file: Buffer;
  fileName: string;
  mimeType: string;
  folder: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface IStorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
