import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { MetaModule } from './modules/meta/meta.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AdminModule } from './modules/admin/admin.module';
import { GamesModule } from './modules/games/games.module';
import { GameIntegrationModule } from './modules/game-integration/game-integration.module';

/**
 * Modular monolith root.
 * Domain modules are added phase by phase (auth, games, support, …).
 */
@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    DatabaseModule,
    RedisModule,
    RbacModule,
    UsersModule,
    AuthModule,
    AdminModule,
    GamesModule,
    GameIntegrationModule,
    HealthModule,
    MetaModule,
  ],
})
export class AppModule {}
