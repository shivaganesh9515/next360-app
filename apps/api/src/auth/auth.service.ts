import { Injectable, Logger, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomInt, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpLoginDto } from './dto/verify-otp-login.dto';
import { UserRole } from '@prisma/client';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;

  // In-memory phone-OTP store — fine for a single-instance MVP, but won't
  // survive a process restart or work across multiple instances. Same
  // caveat as the delivery-assignment-locking Redis item in CLAUDE.md's Risk
  // Register — move this to Redis (or a short-lived DB table) once
  // horizontal scaling or zero-downtime deploys matter.
  private readonly otpStore = new Map<string, OtpEntry>();
  private static readonly OTP_TTL_MS = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
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

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      refresh_token: refreshToken,
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

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      refresh_token: refreshToken,
    };
  }

  // Zomato-style single phone-OTP flow for the customer app — send-otp +
  // verify-otp-login together replace signup/login for that client entirely
  // (email+password above stays as-is for vendor/admin, which still use it).
  async sendOtp(dto: SendOtpDto) {
    const code = String(randomInt(100000, 999999));
    this.otpStore.set(dto.phone, { code, expiresAt: Date.now() + AuthService.OTP_TTL_MS });

    // No SMS gateway wired up yet (see CLAUDE.md's open decisions register) —
    // logged server-side so the code is reachable for manual testing until
    // one is. Replace with a real provider call (e.g. MSG91/Twilio) here.
    this.logger.log(`OTP for ${dto.phone}: ${code} (valid ${AuthService.OTP_TTL_MS / 60000} min)`);

    return { message: 'OTP sent' };
  }

  async verifyOtpLogin(dto: VerifyOtpLoginDto) {
    const entry = this.otpStore.get(dto.phone);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('OTP expired or not requested. Request a new code and try again.');
    }
    if (entry.code !== dto.otp) {
      throw new UnauthorizedException('Incorrect code.');
    }
    this.otpStore.delete(dto.phone);

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    let isNewUser = false;
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: dto.phone, role: 'CUSTOMER' },
      });
      isNewUser = true;
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Send welcome notification for new users
    if (isNewUser && user) {
      this.notificationsService.sendWelcomeNotification(user.id).catch(() => {});
    }

    const token = this.jwtService.sign({ sub: user.id, phone: user.phone, role: user.role });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      refresh_token: refreshToken,
      isNewUser,
    };
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
    if (this.supabase) {
      const { error } = await this.supabase.auth.verifyOtp({
        email: dto.email,
        token: dto.otp,
        type: 'email',
      });

      if (error) {
        throw new BadRequestException(`OTP verification failed: ${error.message}`);
      }
    }

    return { message: 'OTP verified successfully' };
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

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
      refresh_token: refreshToken,
      isNewUser,
    };
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

  async refresh(refreshTokenValue: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.isRevoked) {
      // Potential token reuse — revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, isRevoked: false },
        data: { isRevoked: true },
      });
      this.logger.warn(`Refresh token reuse detected for user ${record.userId} — all tokens revoked`);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!record.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Revoke old token, issue new pair (rotation)
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { isRevoked: true },
    });

    const newAccessToken = this.jwtService.sign({
      sub: record.user.id,
      email: record.user.email,
      role: record.user.role,
    });

    const newRefreshToken = await this.generateRefreshToken(record.user.id);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiry

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
