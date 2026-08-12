import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { GamesModule } from '../games/games.module';
import { ClientGameProvider } from './client-game-provider';
import { GAME_PROVIDER } from './game-provider.interface';
import { GameIntegrationController } from './game-integration.controller';
import { GameIntegrationService } from './game-integration.service';
import { MockGameProvider } from './mock-game-provider';
import { RoutingGameProvider } from './routing-game-provider';
import { VblinkApiClient } from './vblink/vblink-api-client';
import { VblinkGameProvider } from './vblink/vblink-game-provider';

@Module({
  imports: [GamesModule, AppConfigModule],
  controllers: [GameIntegrationController],
  providers: [
    MockGameProvider,
    ClientGameProvider,
    VblinkApiClient,
    VblinkGameProvider,
    RoutingGameProvider,
    {
      provide: GAME_PROVIDER,
      useExisting: RoutingGameProvider,
    },
    GameIntegrationService,
  ],
  exports: [GameIntegrationService],
})
export class GameIntegrationModule {}
