import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
