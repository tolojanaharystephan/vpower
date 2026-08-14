import { Module, forwardRef } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { GamesModule } from '../games/games.module';
import { UsersModule } from '../users/users.module';
import { ClientGameProvider } from './client-game-provider';
import { GAME_PROVIDER } from './game-provider.interface';
import { GameIntegrationController } from './game-integration.controller';
import { GameIntegrationService } from './game-integration.service';
import { PlatformsController } from './platforms.controller';
import { RoutingGameProvider } from './routing-game-provider';
import { VblinkClientService } from './vblink-client.service';
import { VblinkSignatureService } from './vblink-signature.service';

@Module({
  imports: [GamesModule, AppConfigModule, forwardRef(() => UsersModule)],
  controllers: [GameIntegrationController, PlatformsController],
  providers: [
    VblinkSignatureService,
    VblinkClientService,
    ClientGameProvider,
    RoutingGameProvider,
    {
      provide: GAME_PROVIDER,
      useExisting: RoutingGameProvider,
    },
    GameIntegrationService,
  ],
  exports: [GameIntegrationService, VblinkClientService, VblinkSignatureService],
})
export class GameIntegrationModule {}
