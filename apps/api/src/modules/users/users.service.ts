import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { and, count, desc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import type { Role } from '@vpower777/types';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
  type User,
} from '../../database/schema';
import type { PermissionCode } from '../rbac/permissions.constants';
import { hashPassword } from '../../common/crypto/password';
import {
  decryptVblinkPassword,
  encryptVblinkPassword,
} from '../../common/crypto/vblink-password';
import { VblinkClientService } from '../game-integration/vblink-client.service';
import { VblinkApiException } from '../game-integration/vblink/vblink-errors';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly vblink: VblinkClientService,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return user;
  }

  async listUsers(input?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<
      ReturnType<UsersService['toPublic']> & {
        isActive: boolean;
        lastLoginAt: Date | null;
        roles: Role[];
      }
    >;
    total: number;
  }> {
    const page = input?.page ?? 1;
    const limit = Math.min(input?.limit ?? 50, 100);
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [isNull(users.deletedAt)];
    if (input?.search?.trim()) {
      const q = `%${input.search.trim()}%`;
      conditions.push(
        or(ilike(users.email, q), ilike(users.firstName, q), ilike(users.lastName, q))!,
      );
    }
    const where = and(...conditions);

    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isActive: users.isActive,
          emailVerifiedAt: users.emailVerifiedAt,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(users).where(where),
    ]);

    const data = await Promise.all(
      rows.map(async (row) => {
        const rbac = await this.getRolesAndPermissions(row.id);
        return {
          id: row.id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          emailVerifiedAt: row.emailVerifiedAt,
          createdAt: row.createdAt,
          isActive: row.isActive,
          lastLoginAt: row.lastLoginAt,
          roles: rbac.roles,
        };
      }),
    );

    return { data, total: Number(countResult[0]?.total ?? 0) };
  }

  async createUser(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const passwordHash = await hashPassword(input.password);
    const [user] = await this.db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      })
      .returning();
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  async assignRole(userId: string, roleName: Role): Promise<void> {
    const [role] = await this.db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    if (!role) throw new Error(`Role ${roleName} not found — run RBAC seed`);

    const [existing] = await this.db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
      .limit(1);
    if (existing) return;

    await this.db.insert(userRoles).values({ userId, roleId: role.id });
  }

  async getRolesAndPermissions(userId: string): Promise<{
    roles: Role[];
    permissions: PermissionCode[];
  }> {
    const rows = await this.db
      .select({
        roleName: roles.name,
        permissionCode: permissions.code,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    const roleSet = new Set<Role>();
    const permSet = new Set<PermissionCode>();
    for (const row of rows) {
      roleSet.add(row.roleName as Role);
      if (row.permissionCode) permSet.add(row.permissionCode as PermissionCode);
    }
    return { roles: [...roleSet], permissions: [...permSet] };
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string },
  ): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({
        ...(input.firstName !== undefined ? { firstName: input.firstName || null } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new Error('Failed to update profile');
    return updated;
  }

  /**
   * Ensure FastAPI player exists for this VPower user.
   * Stores the technical password encrypted (AES-256-GCM).
   * Returns plaintext only to launchSession (authenticated owner), never via /me.
   */
  async ensureVblinkAccount(
    userId: string,
  ): Promise<{ account: string; password: string }> {
    if (!this.vblink.isConfigured()) {
      throw new ServiceUnavailableException('VBlink is not configured');
    }

    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.vblinkAccount && user.vblinkPasswordEncrypted) {
      return {
        account: user.vblinkAccount,
        password: decryptVblinkPassword(user.vblinkPasswordEncrypted),
      };
    }

    const account = randomVblinkAccount(userId);
    const password = randomVblinkPassword();

    let storedAccount = account;
    try {
      const created = await this.vblink.createPlayer(account, password);
      storedAccount = created.fullAccount || account;
      if (created.alreadyExists) {
        this.logger.warn(`VBlink account already exists for user ${userId} (code 12)`);
        await this.vblink.resetPassword(account, password);
      }
    } catch (err) {
      if (err instanceof VblinkApiException && err.vblinkCode === 12) {
        this.logger.warn(`VBlink account already exists for user ${userId} (code 12)`);
        await this.vblink.resetPassword(account, password);
      } else {
        throw err;
      }
    }

    await this.db
      .update(users)
      .set({
        vblinkAccount: storedAccount,
        vblinkPasswordEncrypted: encryptVblinkPassword(password),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { account: storedAccount, password };
  }

  toPublic(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}

const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL_PASS = LETTERS + DIGITS;

/** 3–16 alphanumeric, derived from user id + random suffix. */
function randomVblinkAccount(userId: string): string {
  const compact = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const suffix = randomBytes(2).toString('hex');
  return `vp${compact}${suffix}`.slice(0, 16);
}

/** 16 chars, letters + digits only (PDF allows symbols; they break form-sign on some stacks). */
function randomVblinkPassword(): string {
  const bytes = randomBytes(16);
  const pick = (alphabet: string, byte: number) => alphabet[byte % alphabet.length] ?? alphabet[0]!;
  const chars: string[] = [pick(LETTERS, bytes[0] ?? 0), pick(DIGITS, bytes[1] ?? 0)];
  for (let i = 2; i < 16; i++) {
    chars.push(pick(ALL_PASS, bytes[i] ?? 0));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = (bytes[i] ?? 0) % (i + 1);
    const a = chars[i] ?? 'a';
    const b = chars[j] ?? 'a';
    chars[i] = b;
    chars[j] = a;
  }
  return chars.join('');
}
