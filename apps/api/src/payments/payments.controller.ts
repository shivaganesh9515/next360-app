import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RazorpayWebhookDto,
} from './dto/create-razorpay-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('razorpay/order')
  @UseGuards(JwtAuthGuard)
  createRazorpayOrder(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateRazorpayOrderDto,
  ) {
    return this.paymentsService.createRazorpayOrder(user.id, dto);
  }

  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard)
  verifyPayment(
    @CurrentUser() user: { id: string },
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.id, dto);
  }

  @Post('razorpay/webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Body() dto: RazorpayWebhookDto,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // In production, verify webhook signature here using razorpay_webhook_secret
    return this.paymentsService.handleWebhook(dto);
  }

  @Post('refund/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  refund(@Param('orderId') orderId: string, @Body() dto: { reason?: string }) {
    return this.paymentsService.initiateRefund(orderId, dto.reason);
  }

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  getPayments(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsForOrder(orderId);
  }
}
