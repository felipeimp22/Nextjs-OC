// lib/payment/interfaces/IPaymentProvider.ts

export interface PaymentIntentOptions {
  amount: number; // in cents
  currency: string;
  orderId: string;
  restaurantId: string;
  metadata?: Record<string, any>;
  platformFee?: number; // in cents
  applicationFeeAmount?: number; // in cents (for connected accounts)
  connectedAccountId?: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  publicKey: string;
  paymentIntentId: string;
  testMode?: boolean;
  accountType?: 'platform' | 'connected' | 'test';
}

export interface PaymentConfirmOptions {
  paymentIntentId: string;
  paymentMethodId?: string;
  connectedAccountId?: string;
}

export interface PaymentConfirmResult {
  status: string;
  paymentIntentId: string;
  amount: number;
}

export interface RefundOptions {
  chargeId: string;
  amount?: number; // in cents, optional for full refund
  reason?: string;
  connectedAccountId?: string;
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: string;
}

export interface PaymentStatusResult {
  status: string;
  amount: number;
  paymentIntentId: string;
  metadata?: Record<string, any>;
}

export interface WebhookVerificationOptions {
  payload: string | Buffer;
  signature: string;
  secret: string;
}

export interface IPaymentProvider {
  // Initialize the provider
  initialize(config: any): Promise<void>;

  // Create payment intent
  createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentIntentResult>;

  // Confirm a payment
  confirmPayment(options: PaymentConfirmOptions): Promise<PaymentConfirmResult>;

  // Check payment status
  getPaymentStatus(paymentIntentId: string, connectedAccountId?: string): Promise<PaymentStatusResult>;

  // Process refund
  processRefund(options: RefundOptions): Promise<RefundResult>;

  // Verify webhook signature
  verifyWebhook(options: WebhookVerificationOptions): any;

  // Get provider name
  getProviderName(): string;
}
