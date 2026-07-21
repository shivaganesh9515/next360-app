import { IsUUID } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsUUID()
  orderId: string;
}

export class VerifyPaymentDto {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class RazorpayWebhookDto {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
        currency: string;
        method: string;
        /** Razorpay error fields — present only for payment.failed events */
        error_description?: string;
        error_reason?: string;
        error_code?: string;
        error_source?: string;
      };
    };
    order?: {
      entity: {
        id: string;
        status: string;
        amount: number;
        currency: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        order_id: string;
        status: string;
        amount: number;
        created_at: number;
      };
    };
  };
}
