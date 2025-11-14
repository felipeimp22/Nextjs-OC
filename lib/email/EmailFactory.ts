// lib/email/EmailFactory.ts

import { IEmailProvider } from './interfaces/IEmailProvider';
import { MailgunEmailProvider } from './providers/MailgunEmailProvider';

export class EmailFactory {
  private static instance: IEmailProvider | null = null;
  private static currentProvider: string | null = null;

  static async getProvider(provider?: string): Promise<IEmailProvider> {
    const selectedProvider = provider || process.env.NEXT_EMAIL_PROVIDER || 'mailgun';

    if (this.instance && this.currentProvider !== selectedProvider) {
      this.instance = null;
    }

    if (!this.instance) {
      this.currentProvider = selectedProvider;

      switch (selectedProvider.toLowerCase()) {
        case 'mailgun': {
          const mailgunProvider = new MailgunEmailProvider();

          await mailgunProvider.initialize({
            apiKey: process.env.NEXT_EMAIL_API_KEY!,
            domain: process.env.NEXT_EMAIL_DOMAIN!,
            baseUrl: process.env.NEXT_EMAIL_PROVIDER === 'api.mailgun.net'
              ? `https://api.mailgun.net/v3/${process.env.NEXT_EMAIL_DOMAIN}`
              : undefined,
          });

          this.instance = mailgunProvider;
          break;
        }

        default:
          throw new Error(`Unsupported email provider: ${selectedProvider}`);
      }

      console.log(`✅ Email provider initialized: ${selectedProvider}`);
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
    this.currentProvider = null;
  }
}
