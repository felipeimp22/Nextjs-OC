import { IStorageProvider } from './interfaces/IStorageProvider';
import { WasabiStorageProvider } from './providers/WasabiStorageProvider';

export class StorageFactory {
  private static instance: IStorageProvider | null = null;

  static getProvider(): IStorageProvider {
    if (!this.instance) {
      const provider = process.env.STORAGE_PROVIDER || 'wasabi';

      switch (provider.toLowerCase()) {
        case 'wasabi':
          this.instance = new WasabiStorageProvider({
            accessKey: process.env.WASABI_ACCESS_KEY!,
            secretKey: process.env.WASABI_SECRET_KEY!,
            bucket: process.env.WASABI_BUCKET!,
            region: process.env.WASABI_REGION!,
            endpoint: process.env.WASABI_ENDPOINT!,
          });
          break;
        default:
          throw new Error(`Unsupported storage provider: ${provider}`);
      }
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}
