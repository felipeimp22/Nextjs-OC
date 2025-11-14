// lib/email/providers/MailgunEmailProvider.ts

import { IEmailProvider, EmailOptions, SendEmailResult } from '../interfaces/IEmailProvider';
import axios from 'axios';

export class MailgunEmailProvider implements IEmailProvider {
  private apiKey: string = '';
  private domain: string = '';
  private baseUrl: string = '';

  async initialize(config: {
    apiKey: string;
    domain: string;
    baseUrl?: string;
  }): Promise<void> {
    this.apiKey = config.apiKey;
    this.domain = config.domain;
    this.baseUrl = config.baseUrl || `https://api.mailgun.net/v3/${this.domain}`;
    console.log(`✅ Mailgun initialized for domain: ${this.domain}`);
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    try {
      const formData = new URLSearchParams();
      formData.append('from', options.from || `OrderChop <noreply@${this.domain}>`);
      formData.append('to', Array.isArray(options.to) ? options.to.join(',') : options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);

      if (options.text) formData.append('text', options.text);
      if (options.replyTo) formData.append('h:Reply-To', options.replyTo);
      if (options.cc && options.cc.length > 0) formData.append('cc', options.cc.join(','));
      if (options.bcc && options.bcc.length > 0) formData.append('bcc', options.bcc.join(','));

      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          formData.append(`v:${key}`, String(value));
        });
      }

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        formData.toString(),
        {
          auth: {
            username: 'api',
            password: this.apiKey,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        messageId: response.data.id,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Error sending email:', error.response?.data || error.message);
      throw new Error(`Failed to send email: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendBulkEmail(options: EmailOptions[]): Promise<SendEmailResult[]> {
    return Promise.all(options.map(opt => this.sendEmail(opt)));
  }

  getProviderName(): string {
    return 'mailgun';
  }
}
