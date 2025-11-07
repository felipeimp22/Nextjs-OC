// lib/delivery/DeliveryFactory.ts

import { IDeliveryProvider } from './interfaces/IDeliveryProvider';
import { ShipdayDeliveryProvider } from './providers/ShipdayDeliveryProvider';

export class DeliveryFactory {
  private static instance: IDeliveryProvider | null = null;
  private static currentProvider: string | null = null;

  static async getProvider(provider?: string): Promise<IDeliveryProvider> {
    const selectedProvider = provider || process.env.DRIVER_PROVIDER || 'shipday';

    // Reset instance if provider changed
    if (this.instance && this.currentProvider !== selectedProvider) {
      this.instance = null;
    }

    if (!this.instance) {
      this.currentProvider = selectedProvider;

      switch (selectedProvider.toLowerCase()) {
        case 'shipday': {
          const shipdayProvider = new ShipdayDeliveryProvider();

          await shipdayProvider.initialize({
            apiKey: process.env.SHIPDAY_API_KEY!,
            baseUrl: process.env.SHIPDAY_BASE_URL || 'https://api.shipday.com',
            dryRun: process.env.SHIPDAY_DRY_RUN === 'true',
          });

          this.instance = shipdayProvider;
          break;
        }

        case 'doordash':
        case 'ubereats':
          // TODO: Implement these providers as needed
          throw new Error(`${selectedProvider} provider not yet implemented. Please implement the provider following the IDeliveryProvider interface.`);

        case 'internal':
          // For restaurants that manage their own drivers
          throw new Error('Internal delivery management not yet implemented');

        default:
          throw new Error(`Unsupported delivery provider: ${selectedProvider}`);
      }

      console.log(`✅ Delivery provider initialized: ${selectedProvider}`);
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
    this.currentProvider = null;
  }
}
