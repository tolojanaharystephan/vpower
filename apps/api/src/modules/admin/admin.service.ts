import { Inject, Injectable } from '@nestjs/common';
import { count, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { users } from '../../database/schema';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: AppConfigService,
  ) {}

  async getOverview() {
    const [row] = await this.db
      .select({ total: count() })
      .from(users)
      .where(isNull(users.deletedAt));

    return {
      usersTotal: Number(row?.total ?? 0),
      featureFlags: this.config.featureFlags,
      gameProviderMode: this.config.gameProviderMode,
      timestamp: new Date().toISOString(),
    };
  }
}
