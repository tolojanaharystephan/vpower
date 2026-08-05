import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  notifications,
  permissions,
  rolePermissions,
  userRoles,
  type Notification,
} from '../../database/schema';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(input: {
    userId: string;
    type: Notification['type'];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const [row] = await this.db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
      })
      .returning();
    return row;
  }

  async createMany(
    userIds: string[],
    input: {
      type: Notification['type'];
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return [];
    return this.db
      .insert(notifications)
      .values(
        unique.map((userId) => ({
          userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data ?? {},
        })),
      )
      .returning();
  }

  /** Users who hold support:read (via any role). */
  async listSupportStaffUserIds(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(permissions.code, 'support:read'));
    return rows.map((r) => r.userId);
  }

  async listForUser(userId: string, input?: { limit?: number; unreadOnly?: boolean }) {
    const limit = Math.min(input?.limit ?? 30, 100);
    const conditions = [eq(notifications.userId, userId)];
    if (input?.unreadOnly) conditions.push(isNull(notifications.readAt));

    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return rows.map((row) => this.toPublic(row));
  }

  async unreadCount(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return Number(row?.total ?? 0);
  }

  async markRead(userId: string, id: string) {
    const [row] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return row ? this.toPublic(row) : null;
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { ok: true };
  }

  toPublic(row: Notification) {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      data: row.data,
      readAt: row.readAt,
      createdAt: row.createdAt,
    };
  }
}
