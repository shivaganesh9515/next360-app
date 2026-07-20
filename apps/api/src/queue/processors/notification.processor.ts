import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'push':
        return this.handlePush(job.data);
      case 'email':
        return this.handleEmail(job.data);
      case 'sms':
        return this.handleSms(job.data);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handlePush(data: { title: string; body: string; token: string; data?: any }) {
    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.token,
          sound: 'default',
          title: data.title,
          body: data.body,
          data: data.data || {},
        }),
      });
      const result = await response.json() as { errors?: unknown[] };
      if (result.errors) {
        this.logger.error(`Push failed: ${JSON.stringify(result.errors)}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Push error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  private async handleEmail(data: { to: string; subject: string; body: string }) {
    // Email provider not configured yet — log for now
    this.logger.log(`[EMAIL] To: ${data.to}, Subject: ${data.subject}`);
    this.logger.log(`[EMAIL] Body: ${data.body.substring(0, 200)}...`);
  }

  private async handleSms(data: { phone: string; message: string }) {
    // SMS provider not configured yet — log for now
    // Replace with MSG91 or Twilio API call once credentials are in .env
    this.logger.log(`[SMS] To: ${data.phone}: ${data.message}`);
  }
}
