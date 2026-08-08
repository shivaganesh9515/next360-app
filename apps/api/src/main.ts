import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initSentry } from './sentry';
import helmet from 'helmet';

// Load environment variables from .env
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function bootstrap() {
  // Initialize Sentry for error monitoring
  initSentry();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Security hardening
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // API_PORT is the explicit override; PORT is the standard env var that
  // Railway / Render / Fly.io inject (they forward traffic to it). Without
  // the PORT fallback the app would listen on 4000 and the platform's
  // health checks would never reach it.
  const port = process.env.API_PORT || process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Next360 API running on http://localhost:${port}`);
  console.log(`📋 Health check at http://localhost:${port}/api/health`);
}

bootstrap();
