import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ROOM_SLUGS, ROLES, type RoomSlug } from '@vpower777/types';
import { AppConfigService } from '../../config/app-config.service';
import { UsersService } from '../users/users.service';
import { AgentOpsService } from '../agent/agent-ops.service';

/**
 * Dev/bootstrap: one ROOM_AGENT per salle when SEED_ADMIN_PASSWORD is set.
 * Emails: agent.{room}@vpower777.test — password = SEED_ADMIN_PASSWORD.
 */
@Injectable()
export class AgentSeedService implements OnModuleInit {
  private readonly logger = new Logger(AgentSeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly ops: AgentOpsService,
    private readonly config: AppConfigService,
  ) {}

  async onModuleInit() {
    const password = this.config.seedAdminPassword;
    if (!password) return;

    try {
      for (const room of ROOM_SLUGS) {
        await this.ensureAgent(room, password);
      }
      this.logger.log(
        `Room agents ensured for ${ROOM_SLUGS.join(', ')} (password = SEED_ADMIN_PASSWORD)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Room agent seed skipped (run db:migrate if tables are missing): ${msg}`,
      );
    }
  }

  private async ensureAgent(room: RoomSlug, password: string) {
    const email = `agent.${room}@vpower777.test`;
    const existing = await this.users.findByEmail(email);
    let userId = existing?.id;
    if (!existing) {
      const created = await this.users.createUser({
        email,
        password,
        firstName: 'Agent',
        lastName: room,
      });
      userId = created.id;
      await this.users.markEmailVerified(userId);
      this.logger.warn(`Seed room agent created: ${email} → ${room}`);
    }
    await this.users.assignRole(userId!, ROLES.ROOM_AGENT);
    await this.ops.assignAgent(userId!, [room]);
  }
}
