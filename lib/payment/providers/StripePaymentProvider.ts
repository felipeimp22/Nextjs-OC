// lib/payment/providers/StripePaymentProvider.ts

import Stripe from 'stripe';
import {
  IPaymentProvider,
  PaymentIntentOptions,
  PaymentIntentResult,
  PaymentConfirmOptions,
  PaymentConfirmResult,
  RefundOptions,
  RefundResult,
  PaymentStatusResult,
  WebhookVerificationOptions,
} from '../interfaces/IPaymentProvider';

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
  apiVersion?: string;
  clientId?: string;
}

export class StripePaymentProvider implements IPaymentProvider {
  private stripe: Stripe | null = null;
  private publishableKey: string = '';
  private webhookSecret: string = '';
  private clientId: string = '';

  async initialize(config: StripeConfig): Promise<void> {
    if (!config.secretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: (config.apiVersion as any) || '2025-03-31.basil',
    });

    this.publishableKey = config.publishableKey;
    this.webhookSecret = config.webhookSecret || '';
    this.clientId = config.clientId || '';

    console.log('✅ Stripe Payment Provider initialized');
  }

  async createPaymentIntent(
    options: PaymentIntentOptions
  ): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const createOptions: Stripe.PaymentIntentCreateParams = {
        amount: options.amount,
        currency: options.currency.toLowerCase(),
        metadata: {
          order_id: options.orderId,
          restaurant_id: options.restaurantId,
          ...options.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      };

      // If using connected account
      if (options.connectedAccountId && options.applicationFeeAmount) {
        createOptions.application_fee_amount = options.applicationFeeAmount;

        const paymentIntent = await this.stripe.paymentIntents.create(
          createOptions,
          { stripeAccount: options.connectedAccountId }
        );

        console.log('💳 Payment intent created on connected account:', paymentIntent.id);

        return {
          clientSecret: paymentIntent.client_secret!,
          publicKey: this.publishableKey,
          paymentIntentId: paymentIntent.id,
          accountType: 'connected',
        };
      } else {
        // Platform account
        const paymentIntent = await this.stripe.paymentIntents.create(createOptions);

        console.log('💳 Payment intent created on platform account:', paymentIntent.id);

        return {
          clientSecret: paymentIntent.client_secret!,
          publicKey: this.publishableKey,
          paymentIntentId: paymentIntent.id,
          accountType: 'platform',
        };
      }
    } catch (error: any) {
      console.error('❌ Stripe payment intent creation failed:', error.message);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPayment(
    options: PaymentConfirmOptions
  ): Promise<PaymentConfirmResult> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const confirmOptions: any = {};

      if (options.paymentMethodId) {
        confirmOptions.payment_method = options.paymentMethodId;
      }

      const stripeOptions: any = {};
      if (options.connectedAccountId) {
        stripeOptions.stripeAccount = options.connectedAccountId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        options.paymentIntentId,
        confirmOptions,
        stripeOptions
      );

      console.log('✅ Payment confirmed:', paymentIntent.status);

      return {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
      };
    } catch (error: any) {
      console.error('❌ Payment confirmation failed:', error.message);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  async getPaymentStatus(
    paymentIntentId: string,
    connectedAccountId?: string
  ): Promise<PaymentStatusResult> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const options: any = {};
      if (connectedAccountId) {
        options.stripeAccount = connectedAccountId;
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        options
      );

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        paymentIntentId: paymentIntent.id,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      console.error('❌ Failed to get payment status:', error.message);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async processRefund(options: RefundOptions): Promise<RefundResult> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const refundParams: Stripe.RefundCreateParams = {
        charge: options.chargeId,
        reason: (options.reason as Stripe.RefundCreateParams.Reason) || undefined,
      };

      if (options.amount) {
        refundParams.amount = options.amount;
      }

      const stripeOptions: any = {};
      if (options.connectedAccountId) {
        stripeOptions.stripeAccount = options.connectedAccountId;
      }

      const refund = await this.stripe.refunds.create(refundParams, stripeOptions);

      console.log('💸 Refund processed:', refund.id);

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error: any) {
      console.error('❌ Refund failed:', error.message);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  verifyWebhook(options: WebhookVerificationOptions): any {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        options.payload,
        options.signature,
        options.secret || this.webhookSecret
      );

      console.log('✅ Webhook verified:', event.type);
      return event;
    } catch (error: any) {
      console.error('❌ Webhook verification failed:', error.message);
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  getProviderName(): string {
    return 'stripe';
  }

  /**
   * Generate Stripe Connect OAuth URL for restaurant onboarding
   * @param restaurantId - Restaurant ID to include in state
   * @param redirectUri - Redirect URI after OAuth
   * @returns OAuth URL
   */
  generateConnectUrl(restaurantId: string, redirectUri: string): string {
    if (!this.clientId) {
      throw new Error('Stripe Client ID not configured');
    }

    const state = Buffer.from(JSON.stringify({ restaurantId })).toString('base64');

    const params = new URLSearchParams({
      client_id: this.clientId,
      state,
      scope: 'read_write',
      redirect_uri: redirectUri,
      'stripe_user[business_type]': 'company',
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for connected account credentials
   * @param code - Authorization code from OAuth redirect
   * @returns Connected account details
   */
  async completeConnectOAuth(code: string): Promise<{
    stripeUserId: string;
    accessToken: string;
    refreshToken: string;
    publishableKey: string;
  }> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await this.stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      });

      return {
        stripeUserId: response.stripe_user_id,
        accessToken: response.access_token,
        refreshToken: response.refresh_token || '',
        publishableKey: response.stripe_publishable_key || '',
      };
    } catch (error: any) {
      console.error('❌ Stripe Connect OAuth failed:', error.message);
      throw new Error(`Failed to complete OAuth: ${error.message}`);
    }
  }

  /**
   * Get connected account details
   * @param accountId - Stripe connected account ID
   * @returns Account details
   */
  async getConnectedAccount(accountId: string): Promise<Stripe.Account> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error: any) {
      console.error('❌ Failed to retrieve connected account:', error.message);
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Create account link for onboarding
   * @param accountId - Stripe connected account ID
   * @param refreshUrl - URL to redirect if link expires
   * @param returnUrl - URL to redirect after onboarding
   * @returns Account link
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<Stripe.AccountLink> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      return await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
    } catch (error: any) {
      console.error('❌ Failed to create account link:', error.message);
      throw new Error(`Failed to create account link: ${error.message}`);
    }
  }

  /**
   * Create Express account for restaurant
   * @param email - Restaurant email
   * @param country - Country code
   * @returns Created account
   */
  async createExpressAccount(email: string, country: string = 'US'): Promise<Stripe.Account> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      return await this.stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
    } catch (error: any) {
      console.error('❌ Failed to create Express account:', error.message);
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }
}
