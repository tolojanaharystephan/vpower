import { Injectable, Inject } from '@nestjs/common';
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

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

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
