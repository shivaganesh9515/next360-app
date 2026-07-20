import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly msg91AuthKey: string | undefined;
  private readonly twilioAccountSid: string | undefined;
  private readonly twilioAuthToken: string | undefined;

  constructor() {
    this.msg91AuthKey = process.env.MSG91_AUTH_KEY;
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (this.msg91AuthKey) {
      return this.sendViaMsg91(phone, `Your Next360 OTP is ${code}. Valid for 5 minutes.`);
    }
    if (this.twilioAccountSid && this.twilioAuthToken) {
      return this.sendViaTwilio(phone, `Your Next360 OTP is ${code}. Valid for 5 minutes.`);
    }
    // Fallback: log to console (same as before)
    this.logger.log(`[SMS] OTP for ${phone}: ${code} (no SMS provider configured)`);
    return true;
  }

  async send(phone: string, message: string): Promise<boolean> {
    if (this.msg91AuthKey) {
      return this.sendViaMsg91(phone, message);
    }
    if (this.twilioAccountSid && this.twilioAuthToken) {
      return this.sendViaTwilio(phone, message);
    }
    this.logger.log(`[SMS] To ${phone}: ${message}`);
    return true;
  }

  private async sendViaMsg91(phone: string, message: string): Promise<boolean> {
    // MSG91 API implementation
    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': this.msg91AuthKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'NXT360',
          mobiles: phone.replace('+', ''),
          message,
        }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`MSG91 send failed: ${error}`);
      return false;
    }
  }

  private async sendViaTwilio(phone: string, message: string): Promise<boolean> {
    // Twilio API implementation
    try {
      const accountSid = this.twilioAccountSid!;
      const authToken = this.twilioAuthToken!;
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: phone, From: process.env.TWILIO_PHONE_NUMBER || '', Body: message }),
        },
      );
      return response.ok;
    } catch (error) {
      this.logger.error(`Twilio send failed: ${error}`);
      return false;
    }
  }
}
