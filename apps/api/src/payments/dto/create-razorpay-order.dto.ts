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
  };
}
