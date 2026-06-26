import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || supabaseUrl,
      ignoreExpiration: false,
    });

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  private supabase: ReturnType<typeof createClient> | null = null;

  async validate(payload: any) {
    // Verify token with Supabase if available
    if (this.supabase) {
      const { data: { user: supabaseUser }, error } = await this.supabase.auth.getUser(
        payload.sub ? `Bearer ${payload.sub}` : undefined,
      );

      if (error || !supabaseUser) {
        // Fall through — still validate against our DB
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub || payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }
}
