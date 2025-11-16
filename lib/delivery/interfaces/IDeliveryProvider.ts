// lib/delivery/interfaces/IDeliveryProvider.ts

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  lat?: number;
  lng?: number;
  instructions?: string;
}

export interface DeliveryEstimateOptions {
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  orderValue?: number;
  items?: number;
}

export interface DeliveryEstimateResult {
  fee: number;
  estimatedTime?: number; // in minutes
  distance?: number;
  currency?: string;
  service?: string;
  provider: string;
}

export interface CreateDeliveryOptions {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  restaurantPhone: string;
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderValue: number;
  tip?: number;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
  specialInstructions?: string;
  scheduledTime?: Date;
}

export interface CreateDeliveryResult {
  externalId: string;
  trackingUrl: string;
  status: string;
  estimatedDeliveryTime?: Date;
  driverInfo?: {
    name?: string;
    phone?: string;
    vehicle?: string;
  };
}

export interface DeliveryStatusResult {
  status: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  driverInfo?: {
    name?: string;
    phone?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface CancelDeliveryOptions {
  externalId: string;
  reason?: string;
}

export interface IDeliveryProvider {
  // Initialize the provider
  initialize(config: any): Promise<void>;

  // Get delivery fee estimate
  getEstimate(options: DeliveryEstimateOptions): Promise<DeliveryEstimateResult>;

  // Create a delivery
  createDelivery(options: CreateDeliveryOptions): Promise<CreateDeliveryResult>;

  // Get delivery status
  getDeliveryStatus(externalId: string): Promise<DeliveryStatusResult>;

  // Cancel delivery
  cancelDelivery(options: CancelDeliveryOptions): Promise<void>;

  // Get provider name
  getProviderName(): string;
}
