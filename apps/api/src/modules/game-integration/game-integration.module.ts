import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { GamesModule } from '../games/games.module';
import { ClientGameProvider } from './client-game-provider';
import { GAME_PROVIDER } from './game-provider.interface';
import { GameIntegrationController } from './game-integration.controller';
import { GameIntegrationService } from './game-integration.service';
import { MockGameProvider } from './mock-game-provider';

@Module({
  imports: [GamesModule, AppConfigModule],
  controllers: [GameIntegrationController],
  providers: [
    MockGameProvider,
    ClientGameProvider,
    {
      provide: GAME_PROVIDER,
      useFactory: (
        config: AppConfigService,
        mock: MockGameProvider,
        client: ClientGameProvider,
      ) => (config.gameProviderMode === 'client' ? client : mock),
      inject: [AppConfigService, MockGameProvider, ClientGameProvider],
    },
    GameIntegrationService,
  ],
  exports: [GameIntegrationService],
})
export class GameIntegrationModule {}
