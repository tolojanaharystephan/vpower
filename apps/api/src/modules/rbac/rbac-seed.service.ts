import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ROLES, type Role } from '@vpower777/types';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { permissions, rolePermissions, roles } from '../../database/schema';
import {
  ALL_PERMISSION_CODES,
  ROLE_PERMISSION_MAP,
} from './permissions.constants';

@Injectable()
export class RbacSeedService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  async ensureSeeded(): Promise<void> {
    for (const code of ALL_PERMISSION_CODES) {
      const [existing] = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.code, code))
        .limit(1);
      if (!existing) {
        await this.db.insert(permissions).values({ code, description: code });
      }
    }

    const roleNames = Object.values(ROLES) as Role[];
    for (const name of roleNames) {
      const [existing] = await this.db.select().from(roles).where(eq(roles.name, name)).limit(1);
      if (!existing) {
        await this.db.insert(roles).values({ name, description: name });
      }
    }

    const allRoles = await this.db.select().from(roles);
    const allPerms = await this.db.select().from(permissions);
    const roleByName = new Map(allRoles.map((r) => [r.name, r]));
    const permByCode = new Map(allPerms.map((p) => [p.code, p]));

    for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSION_MAP) as [
      Role,
      string[],
    ][]) {
      const role = roleByName.get(roleName);
      if (!role) continue;
      for (const code of permCodes) {
        const perm = permByCode.get(code);
        if (!perm) continue;
        const [existing] = await this.db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, role.id),
              eq(rolePermissions.permissionId, perm.id),
            ),
          )
          .limit(1);
        if (!existing) {
          await this.db
            .insert(rolePermissions)
            .values({ roleId: role.id, permissionId: perm.id });
        }
      }
    }

    this.logger.log('RBAC roles & permissions seeded');
  }
}
