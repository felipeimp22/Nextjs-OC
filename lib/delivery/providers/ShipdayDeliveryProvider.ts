// lib/delivery/providers/ShipdayDeliveryProvider.ts

import axios, { AxiosInstance } from 'axios';
import {
  IDeliveryProvider,
  DeliveryEstimateOptions,
  DeliveryEstimateResult,
  CreateDeliveryOptions,
  CreateDeliveryResult,
  DeliveryStatusResult,
  CancelDeliveryOptions,
  DeliveryAddress,
} from '../interfaces/IDeliveryProvider';

export interface ShipdayConfig {
  apiKey: string;
  baseUrl?: string;
  dryRun?: boolean;
}

export class ShipdayDeliveryProvider implements IDeliveryProvider {
  private client: AxiosInstance | null = null;
  private dryRun: boolean = false;

  async initialize(config: ShipdayConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Shipday API key is required');
    }

    this.dryRun = config.dryRun || false;
    const baseUrl = config.baseUrl || 'https://api.shipday.com';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Basic ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log(`✅ Shipday Delivery Provider initialized${this.dryRun ? ' (DRY RUN MODE)' : ''}`);
  }

  private formatAddress(address: DeliveryAddress): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}${address.country ? ', ' + address.country : ''}`;
  }

  async getEstimate(options: DeliveryEstimateOptions): Promise<DeliveryEstimateResult> {
    if (!this.client) {
      throw new Error('Shipday not initialized');
    }

    if (this.dryRun) {
      console.log('🚫 DRY RUN: Simulating Shipday estimate');
      return {
        fee: 5.99,
        estimatedTime: 30,
        distance: 3.5,
        currency: 'USD',
        service: 'Standard',
        provider: 'shipday',
      };
    }

    try {
      const pickupAddress = this.formatAddress(options.pickupAddress);
      const deliveryAddress = this.formatAddress(options.deliveryAddress);

      console.log('📍 Requesting Shipday estimate:', { pickupAddress, deliveryAddress });

      const response = await this.client.post('/driver/availability', {
        pickupAddress,
        deliveryAddress,
      });

      // Shipday returns array of available services
      const services = Array.isArray(response.data) ? response.data : [response.data];
      const firstService = services[0];

      if (!firstService || typeof firstService.fee !== 'number') {
        console.warn('⚠️ No valid Shipday service available');
        throw new Error('No delivery service available');
      }

      console.log('✅ Shipday estimate received:', firstService);

      return {
        fee: firstService.fee,
        estimatedTime: firstService.estimatedTime || 30,
        distance: firstService.distance,
        currency: 'USD',
        service: firstService.name || 'Standard',
        provider: 'shipday',
      };
    } catch (error: any) {
      console.error('❌ Shipday estimate failed:', error.response?.data || error.message);
      throw new Error(`Failed to get delivery estimate: ${error.message}`);
    }
  }

  async createDelivery(options: CreateDeliveryOptions): Promise<CreateDeliveryResult> {
    if (!this.client) {
      throw new Error('Shipday not initialized');
    }

    if (this.dryRun) {
      const externalId = `dryrun-${Date.now()}`;
      console.log('🚫 DRY RUN: Simulating Shipday delivery creation');
      return {
        externalId,
        trackingUrl: `https://example.com/track/${externalId}`,
        status: 'simulated',
      };
    }

    try {
      const pickupAddress = this.formatAddress(options.pickupAddress);
      const deliveryAddress = this.formatAddress(options.deliveryAddress);

      const payload = {
        orderNumber: options.orderNumber,
        restaurantName: options.pickupAddress.street, // Should be from restaurant data
        restaurantAddress: pickupAddress,
        restaurantPhoneNumber: options.pickupAddress.instructions || '', // Should be from restaurant data
        customerName: options.customerName,
        customerAddress: deliveryAddress,
        customerPhoneNumber: options.customerPhone,
        customerEmail: options.customerEmail || '',
        orderValue: options.orderValue,
        tip: options.tip || 0,
        deliveryInstruction: options.specialInstructions || '',
        pickupTime: options.scheduledTime?.toISOString() || new Date().toISOString(),
        orderItems: options.items?.map(item => ({
          name: item.name,
          quantity: item.quantity,
        })) || [],
      };

      console.log('📦 Creating Shipday delivery for order:', options.orderNumber);

      const response = await this.client.post('/order', payload);

      if (!response.data.orderId) {
        throw new Error('No order ID returned from Shipday');
      }

      console.log('✅ Shipday delivery created:', response.data.orderId);

      return {
        externalId: response.data.orderId,
        trackingUrl: response.data.trackingLink || `https://shipday.com/track/${response.data.orderId}`,
        status: 'assigned',
        estimatedDeliveryTime: response.data.expectedDeliveryTime
          ? new Date(response.data.expectedDeliveryTime)
          : undefined,
      };
    } catch (error: any) {
      console.error('❌ Shipday delivery creation failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`Failed to create delivery: ${error.response?.data?.message || error.message}`);
    }
  }

  async getDeliveryStatus(externalId: string): Promise<DeliveryStatusResult> {
    if (!this.client) {
      throw new Error('Shipday not initialized');
    }

    if (this.dryRun) {
      console.log('🚫 DRY RUN: Simulating Shipday status check');
      return {
        status: 'in_transit',
      };
    }

    try {
      console.log('🔍 Checking Shipday delivery status:', externalId);

      const response = await this.client.get(`/order/${externalId}`);

      return {
        status: this.mapShipdayStatus(response.data.orderState),
        estimatedDeliveryTime: response.data.expectedDeliveryTime
          ? new Date(response.data.expectedDeliveryTime)
          : undefined,
        actualDeliveryTime: response.data.deliveredTime
          ? new Date(response.data.deliveredTime)
          : undefined,
        driverInfo: response.data.driver ? {
          name: response.data.driver.name,
          phone: response.data.driver.phoneNumber,
          location: response.data.driver.location ? {
            lat: response.data.driver.location.latitude,
            lng: response.data.driver.location.longitude,
          } : undefined,
        } : undefined,
      };
    } catch (error: any) {
      console.error('❌ Failed to get Shipday status:', error.message);
      throw new Error(`Failed to get delivery status: ${error.message}`);
    }
  }

  async cancelDelivery(options: CancelDeliveryOptions): Promise<void> {
    if (!this.client) {
      throw new Error('Shipday not initialized');
    }

    if (this.dryRun) {
      console.log('🚫 DRY RUN: Simulating Shipday cancellation');
      return;
    }

    try {
      console.log('❌ Cancelling Shipday delivery:', options.externalId);

      await this.client.delete(`/order/${options.externalId}`, {
        data: { reason: options.reason || 'Order cancelled' },
      });

      console.log('✅ Shipday delivery cancelled');
    } catch (error: any) {
      console.error('❌ Failed to cancel Shipday delivery:', error.message);
      throw new Error(`Failed to cancel delivery: ${error.message}`);
    }
  }

  getProviderName(): string {
    return 'shipday';
  }

  private mapShipdayStatus(shipdayStatus: string): string {
    const statusMap: Record<string, string> = {
      'new': 'pending',
      'ready': 'ready',
      'assigned': 'assigned',
      'pickedup': 'picked_up',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'failed': 'failed',
    };

    return statusMap[shipdayStatus?.toLowerCase()] || 'unknown';
  }
}
