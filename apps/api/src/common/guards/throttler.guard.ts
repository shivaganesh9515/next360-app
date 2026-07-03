import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(req.ip);
  }

  protected getRequestResponse(context: ExecutionContext) {
    const ctx = context.switchToHttp();
    return { req: ctx.getRequest(), res: ctx.getResponse() };
  }

  protected throwThrottlingException(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): void {
    const response = context.switchToHttp().getResponse();
    response.setHeader('Retry-After', Math.ceil(ttl / 1000));
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests, please try again later',
        error: 'TOO_MANY_REQUESTS',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
