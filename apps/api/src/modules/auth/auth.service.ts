import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { ROLES } from '@vpower777/types';
import type { AppEnv } from '../../config/env.schema';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  emailVerificationTokens,
  passwordResetTokens,
  refreshTokens,
} from '../../database/schema';
import {
  generateOpaqueToken,
  hashToken,
  verifyPassword,
} from '../../common/crypto/password';
import { hashPassword } from '../../common/crypto/password';
import { UsersService } from '../users/users.service';
import type { AuthUser, TokenPair } from './auth.types';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppEnv, true>,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'Email already registered',
      });
    }

    const user = await this.users.createUser(dto);
    await this.users.assignRole(user.id, ROLES.CUSTOMER);

    const verifyToken = await this.createEmailVerificationToken(user.id);
    // Phase 12 will send email; log in development for now
    this.logger.log(`Email verification token for ${user.email}: ${verifyToken}`);

    const tokens = await this.issueTokens(user.id, user.email);
    const auth = await this.buildAuthUser(user.id, user.email);

    return {
      user: this.users.toPublic(user),
      ...tokens,
      roles: auth.roles,
      permissions: auth.permissions,
      emailVerificationRequired: true,
    };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const ok = await verifyPassword(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    await this.users.touchLastLogin(user.id);
    const tokens = await this.issueTokens(user.id, user.email, meta);
    const auth = await this.buildAuthUser(user.id, user.email);

    return {
      user: this.users.toPublic(user),
      ...tokens,
      roles: auth.roles,
      permissions: auth.permissions,
    };
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    const tokenHash = hashToken(refreshToken);
    const [stored] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!stored) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    // Rotate: revoke old
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(refreshTokens.id, stored.id));

    const user = await this.users.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found or inactive',
      });
    }

    const tokens = await this.issueTokens(user.id, user.email, meta);
    return tokens;
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = hashToken(refreshToken);
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findByEmail(dto.email);
    // Always return success to avoid email enumeration
    if (user) {
      const token = generateOpaqueToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await this.db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });
      this.logger.log(`Password reset token for ${user.email}: ${token}`);
    }
    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const [row] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired reset token',
      });
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.users.updatePassword(row.userId, passwordHash);
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));

    // Revoke all refresh sessions
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(refreshTokens.userId, row.userId), isNull(refreshTokens.revokedAt)));

    return { success: true };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = hashToken(dto.token);
    const [row] = await this.db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'Invalid or expired verification token',
      });
    }

    await this.users.markEmailVerified(row.userId);
    await this.db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(emailVerificationTokens.id, row.id));

    return { success: true };
  }

  async validateAccessPayload(payload: { sub: string; email: string }): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found or inactive',
      });
    }
    return this.buildAuthUser(user.id, user.email);
  }

  private async buildAuthUser(userId: string, email: string): Promise<AuthUser> {
    const { roles, permissions } = await this.users.getRolesAndPermissions(userId);
    return { id: userId, email, roles, permissions };
  }

  private async issueTokens(
    userId: string,
    email: string,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<TokenPair> {
    const accessExpiresIn = this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true });

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get('JWT_SECRET', { infer: true }),
        expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = generateOpaqueToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = this.parseExpiryDate(refreshExpiresIn);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ip,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      tokenType: 'Bearer',
    };
  }

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const token = generateOpaqueToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.db.insert(emailVerificationTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });
    return token;
  }

  private parseExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const amount = Number(match[1]);
    const unit = match[2];
    const ms =
      unit === 's'
        ? amount * 1000
        : unit === 'm'
          ? amount * 60_000
          : unit === 'h'
            ? amount * 3_600_000
            : amount * 86_400_000;
    return new Date(Date.now() + ms);
  }
}
