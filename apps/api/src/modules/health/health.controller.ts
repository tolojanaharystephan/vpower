import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { BRAND } from '@vpower777/config';
import { Public } from '../../common/decorators';
import { AppConfigService } from '../../config/app-config.service';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { REDIS } from '../../redis/redis.constants';

type CheckState = 'up' | 'down';

type HealthResponse = {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
  checks: {
    api: CheckState;
    database: CheckState;
    redis: CheckState;
  };
  features: {
    paymentsEnabled: boolean;
    liveGamesEnabled: boolean;
    translationEnabled: boolean;
    gameProviderMode: string;
  };
};

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly config: AppConfigService,
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Full health check (api, database, redis)' })
  async check(): Promise<HealthResponse> {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();

    const checks = {
      api: 'up' as const,
      database,
      redis,
    };

    const status =
      database === 'up' && redis === 'up'
        ? 'ok'
        : database === 'down' && redis === 'down'
          ? 'down'
          : 'degraded';

    return {
      status,
      service: `${BRAND.name}-api`,
      timestamp: new Date().toISOString(),
      checks,
      features: {
        ...this.config.featureFlags,
        gameProviderMode: this.config.gameProviderMode,
      },
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok' as const };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (database + redis)' })
  async ready() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    const ready = database === 'up' && redis === 'up';
    return {
      status: ready ? ('ok' as const) : ('not_ready' as const),
      checks: { database, redis },
    };
  }

  private async checkDatabase(): Promise<CheckState> {
    try {
      await this.db.execute(sql`select 1`);
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<CheckState> {
    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
