// lib/email/interfaces/IEmailProvider.ts

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  messageId: string;
  status: string;
  timestamp: Date;
}

export interface IEmailProvider {
  initialize(config: any): Promise<void>;
  sendEmail(options: EmailOptions): Promise<SendEmailResult>;
  sendBulkEmail(options: EmailOptions[]): Promise<SendEmailResult[]>;
  getProviderName(): string;
}
