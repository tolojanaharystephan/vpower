import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ROLES } from '@vpower777/types';
import { AppConfigService } from '../../config/app-config.service';
import { UsersService } from '../users/users.service';

/**
 * Dev/bootstrap helper: create a staff admin when SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD are set.
 * Never runs with empty credentials.
 */
@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: AppConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.seedAdminEmail;
    const password = this.config.seedAdminPassword;
    if (!email || !password) return;

    const role = this.config.seedAdminRole;
    const existing = await this.users.findByEmail(email);
    if (existing) {
      await this.users.assignRole(existing.id, role);
      this.logger.log(`Seed admin exists — ensured role ${role} on ${email}`);
      return;
    }

    const user = await this.users.createUser({
      email,
      password,
      firstName: 'Admin',
      lastName: 'VPower',
    });
    await this.users.assignRole(user.id, ROLES.CUSTOMER);
    await this.users.assignRole(user.id, role);
    await this.users.markEmailVerified(user.id);
    this.logger.warn(`Seed admin created: ${email} (${role})`);
  }
}
