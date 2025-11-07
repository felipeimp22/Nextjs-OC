// lib/payment/index.ts

export { PaymentFactory } from './PaymentFactory';
export { StripePaymentProvider } from './providers/StripePaymentProvider';
export { MercadoPagoPaymentProvider } from './providers/MercadoPagoPaymentProvider';
export type {
  IPaymentProvider,
  PaymentIntentOptions,
  PaymentIntentResult,
  PaymentConfirmOptions,
  PaymentConfirmResult,
  RefundOptions,
  RefundResult,
  PaymentStatusResult,
  WebhookVerificationOptions,
} from './interfaces/IPaymentProvider';
