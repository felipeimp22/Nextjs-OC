// lib/payment/PaymentFactory.ts

import { IPaymentProvider } from './interfaces/IPaymentProvider';
import { StripePaymentProvider } from './providers/StripePaymentProvider';
import { MercadoPagoPaymentProvider } from './providers/MercadoPagoPaymentProvider';

export class PaymentFactory {
  private static instance: IPaymentProvider | null = null;
  private static currentProvider: string | null = null;

  static async getProvider(provider?: string): Promise<IPaymentProvider> {
    const selectedProvider = provider || process.env.PAYMENT_PROVIDER || 'stripe';

    // Reset instance if provider changed
    if (this.instance && this.currentProvider !== selectedProvider) {
      this.instance = null;
    }

    if (!this.instance) {
      this.currentProvider = selectedProvider;

      switch (selectedProvider.toLowerCase()) {
        case 'stripe': {
          const stripeProvider = new StripePaymentProvider();

          await stripeProvider.initialize({
            secretKey: process.env.NODE_ENV === 'production'
              ? process.env.STRIPE_LIVE_SECRET_KEY!
              : process.env.STRIPE_TEST_SECRET_KEY!,
            publishableKey: process.env.NODE_ENV === 'production'
              ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY!
              : process.env.STRIPE_TEST_PUBLISHABLE_KEY!,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          });

          this.instance = stripeProvider;
          break;
        }

        case 'mercadopago': {
          const mercadoPagoProvider = new MercadoPagoPaymentProvider();

          await mercadoPagoProvider.initialize({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
            publicKey: process.env.MERCADOPAGO_PUBLIC_KEY!,
            webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
          });

          this.instance = mercadoPagoProvider;
          break;
        }

        default:
          throw new Error(`Unsupported payment provider: ${selectedProvider}`);
      }

      console.log(`✅ Payment provider initialized: ${selectedProvider}`);
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
    this.currentProvider = null;
  }
}
