import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { DgamesApiClient } from './dgames-api.client';
import { DgamesCallbackController } from './dgames-callback.controller';
import { DgamesCallbackService } from './dgames-callback.service';
import { DgamesPlatformsController } from './dgames-platforms.controller';
import { ProviderDgamesService } from './provider-dgames.service';

@Module({
  imports: [AppConfigModule, WalletModule],
  controllers: [DgamesCallbackController, DgamesPlatformsController],
  providers: [DgamesApiClient, DgamesCallbackService, ProviderDgamesService],
  exports: [ProviderDgamesService, DgamesApiClient],
})
export class ProviderDgamesModule {}
