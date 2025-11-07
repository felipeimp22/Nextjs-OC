import { StorageProvider, StorageProviderType } from './types';
import { WasabiStorageProvider } from './wasabi';

let storageProviderInstance: StorageProvider | null = null;

export function getStorageProvider(type?: StorageProviderType): StorageProvider {
  if (storageProviderInstance) {
    return storageProviderInstance;
  }

  const providerType = type || (process.env.STORAGE_PROVIDER as StorageProviderType) || 'wasabi';

  switch (providerType) {
    case 'wasabi':
      storageProviderInstance = new WasabiStorageProvider();
      break;
    default:
      throw new Error(`Storage provider ${providerType} not implemented`);
  }

  return storageProviderInstance;
}

export * from './types';
