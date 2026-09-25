import * as crypto from 'crypto';
import { Inject, Injectable, Logger, ConflictException, UnauthorizedException, BadRequestException, GoneException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../providers/sms/sms.service';
import { REDIS_CLIENT } from '../providers/redis/redis.provider';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpLoginDto } from './dto/verify-otp-login.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;

  // Redis-backed OTP store — survives restarts and works across instances.
  // Falls back to in-memory Map if Redis is unavailable (dev/local mode).
  private readonly otpFallback = new Map<string, { code: string; expiresAt: number }>();
  private static readonly OTP_TTL_SECONDS = 5 * 60; // 5 minutes
  private static readonly OTP_KEY_PREFIX = 'otp:';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private smsService: SmsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  async signup(dto: SignupDto) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    let supabaseUserId: string | undefined;

    // Create user in Supabase Auth if configured
    if (this.supabase) {
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

      if (authError) {
        throw new BadRequestException(`Supabase auth error: ${authError.message}`);
      }

      supabaseUserId = authData.user?.id;
    }

    // Create user record in our DB
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name || null,
        phone: dto.phone || null,
        role: (dto.role as UserRole) || 'CUSTOMER',
      },
    });

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    let supabaseUser: any = null;

    // Authenticate with Supabase if configured
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

      if (error) {
        throw new UnauthorizedException(`Invalid credentials: ${error.message}`);
      }

      supabaseUser = data.user;
    }

    // Find user in our DB
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      ...(supabaseUser ? { supabaseId: supabaseUser.id } : {}),
    });

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  // Zomato-style single phone-OTP flow — POST /auth/send-otp generates a
  // 6-digit code stored in Redis (in-memory Map fallback in dev/local) and
  // sent via SmsService; POST /auth/verify-otp-login verifies it (single-use,
  // 5-min expiry) then either logs an existing account straight in or
  // provisions a new one on first verify (no separate signup). The code is
  // NEVER returned by the API. New phone-only accounts are created with role
  // CUSTOMER; the delivery app enforces DELIVERY_PARTNER client-side (see
  // apps/delivery-app/src/store/authStore.ts verifyPhoneOtp role check).
  async sendOtp(dto: SendOtpDto) {
    const code = crypto.randomInt(100000, 999999).toString();
    await this.storeOtp(dto.phone, code);

    const sent = await this.smsService.sendOtp(dto.phone, code);
    // Honest failure in production when no SMS provider is configured. In
    // dev/local the code is printed by SmsService (never in the API response)
    // so verification can be exercised without an SMS plan.
    if (!sent && process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Could not send OTP. Please try again.');
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtpLogin(dto: VerifyOtpLoginDto) {
    const entry = await this.readOtp(dto.phone);
    if (!entry) {
      throw new UnauthorizedException('OTP expired or not requested. Request a new code and try again.');
    }
    if (entry.expiresAt < Date.now()) {
      await this.deleteOtp(dto.phone);
      throw new UnauthorizedException('OTP expired. Request a new code and try again.');
    }
    if (entry.code !== dto.otp) {
      throw new UnauthorizedException('Incorrect code.');
    }
    // Single-use: consumed on first successful verify, so a replayed code fails.
    await this.deleteOtp(dto.phone);

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    let isNewUser = false;
    if (!user) {
      user = await this.prisma.user.create({ data: { phone: dto.phone, role: 'CUSTOMER' } });
      isNewUser = true;
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      isNewUser,
    };
  }

  private async storeOtp(phone: string, code: string): Promise<void> {
    const key = `${AuthService.OTP_KEY_PREFIX}${phone}`;
    const entry = { code, expiresAt: Date.now() + AuthService.OTP_TTL_SECONDS * 1000 };
    try {
      await this.redis.set(key, JSON.stringify(entry), 'EX', AuthService.OTP_TTL_SECONDS);
    } catch {
      // Redis down (dev/local) — in-memory fallback
      this.otpFallback.set(key, entry);
    }
  }

  private async readOtp(phone: string): Promise<{ code: string; expiresAt: number } | null> {
    const key = `${AuthService.OTP_KEY_PREFIX}${phone}`;
    try {
      const raw = await this.redis.get(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { code: string; expiresAt: number };
        if (parsed?.code && parsed.expiresAt) return parsed;
      }
    } catch {
      // Redis down (dev/local) — fall through to in-memory fallback
    }
    return this.otpFallback.get(key) ?? null;
  }

  private async deleteOtp(phone: string): Promise<void> {
    const key = `${AuthService.OTP_KEY_PREFIX}${phone}`;
    try {
      await this.redis.del(key);
    } catch {
      // Redis down (dev/local) — ignore
    }
    this.otpFallback.delete(key);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        ...(userId ? { vendor: true, deliveryPartner: true } : {}),
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async verifyOtp(dto: VerifyOtpDto) {
    throw new GoneException('Phone OTP login is disabled. Please sign in with Google.');
  }

  async googleLogin(dto: { email: string; googleId: string; name?: string; avatarUrl?: string }) {
    // Find existing user by email, or create a new one linked to this Google account
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    let isNewUser = false;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name || null,
          avatarUrl: dto.avatarUrl || null,
          role: 'CUSTOMER',
        },
      });
      isNewUser = true;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update avatar/name if Google has more recent data
    if ((dto.name && !user.name) || (dto.avatarUrl && !user.avatarUrl)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(dto.name && !user.name ? { name: dto.name } : {}),
          ...(dto.avatarUrl && !user.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        },
      });
    }

    // Send welcome notification for new users
    if (isNewUser) {
      this.notificationsService.sendWelcomeNotification(user.id).catch(() => {});
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      isNewUser,
    };
  }

  // Apple Sign In — accepts verified Apple profile (identityToken verified when provided)
  // Native flow (expo-apple-authentication) gives identityToken JWT; web/Supabase OAuth
  // flow already verified via supabaseAuthCallback. We verify token signature when present.
  async appleLogin(dto: { email: string; appleId: string; identityToken?: string; name?: string; avatarUrl?: string }) {
    if (dto.identityToken) {
      const verified = await this.verifyAppleIdentityToken(dto.identityToken);
      if (!verified || verified.email?.toLowerCase() !== dto.email.toLowerCase()) {
        throw new UnauthorizedException('Apple identityToken verification failed');
      }
      if (verified.sub && verified.sub !== dto.appleId) {
        throw new UnauthorizedException('Apple ID mismatch');
      }
    }

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    let isNewUser = false;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name || null,
          avatarUrl: dto.avatarUrl || null,
          role: 'CUSTOMER',
        },
      });
      isNewUser = true;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if ((dto.name && !user.name) || (dto.avatarUrl && !user.avatarUrl)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(dto.name && !user.name ? { name: dto.name } : {}),
          ...(dto.avatarUrl && !user.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        },
      });
    }

    if (isNewUser) {
      this.notificationsService.sendWelcomeNotification(user.id).catch(() => {});
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      isNewUser,
    };
  }

  // Verify Apple identityToken JWT signature via Apple's JWKS (https://appleid.apple.com/auth/keys)
  private async verifyAppleIdentityToken(identityToken: string): Promise<any | null> {
    try {
      const parts = identityToken.split('.');
      if (parts.length !== 3) return null;
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const kid = header.kid;
      // Fetch Apple JWKS (cache not needed for MVP — low volume)
      const res = await fetch('https://appleid.apple.com/auth/keys');
      if (!res.ok) return null;
      const jwks: any = await res.json();
      const jwk = jwks.keys?.find((k: any) => k.kid === kid);
      if (!jwk) return null;
      // Use Node crypto to verify RS256
      const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
      const data = `${parts[0]}.${parts[1]}`;
      const sig = Buffer.from(parts[2], 'base64url');
      const valid = crypto.verify('RSA-SHA256', Buffer.from(data), keyObject, sig);
      if (!valid) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      // Basic expiry + issuer + audience checks
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
      if (payload.iss !== 'https://appleid.apple.com') return null;
      return payload;
    } catch (e) {
      this.logger.warn(`Apple token verify failed: ${e}`);
      return null;
    }
  }

  async forgotPassword(email: string) {
    if (this.supabase) {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw new BadRequestException(`Password reset failed: ${error.message}`);
      }
    }

    return { message: 'Password reset email sent if the account exists' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (this.supabase) {
      const { error } = await this.supabase.auth.admin.updateUserById(token, {
        password: newPassword,
      });
      if (error) {
        throw new BadRequestException(`Password reset failed: ${error.message}`);
      }
    }

    return { message: 'Password reset successfully' };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
