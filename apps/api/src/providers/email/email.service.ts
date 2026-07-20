import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sendgridKey: string | undefined;
  private readonly resendKey: string | undefined;
  private readonly fromEmail: string;

  constructor() {
    this.sendgridKey = process.env.SENDGRID_API_KEY;
    this.resendKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@next360.com';
  }

  async send(options: { to: string; subject: string; html: string; text?: string }): Promise<boolean> {
    if (this.sendgridKey) {
      return this.sendViaSendGrid(options);
    }
    if (this.resendKey) {
      return this.sendViaResend(options);
    }
    // Fallback: log to console
    this.logger.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`);
    this.logger.log(`[EMAIL] Body: ${(options.html || options.text || '').substring(0, 200)}...`);
    return true;
  }

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Your Next360 OTP Code',
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>Valid for 5 minutes.</p>`,
    });
  }

  async sendOrderConfirmation(email: string, orderNo: string, items: any[]): Promise<boolean> {
    const itemList = items.map((i) => `<li>${i.name} × ${i.quantity} — ₹${i.price}</li>`).join('');
    return this.send({
      to: email,
      subject: `Order Confirmed — #${orderNo}`,
      html: `<h2>Order Confirmed!</h2><p>Your order #${orderNo} has been placed.</p><ul>${itemList}</ul>`,
    });
  }

  private async sendViaSendGrid(options: { to: string; subject: string; html: string }) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: this.fromEmail },
          subject: options.subject,
          content: [{ type: 'text/html', value: options.html }],
        }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`SendGrid failed: ${error}`);
      return false;
    }
  }

  private async sendViaResend(options: { to: string; subject: string; html: string }) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`Resend failed: ${error}`);
      return false;
    }
  }
}
