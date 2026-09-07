import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { VblinkSignatureService } from '../game-integration/vblink-signature.service';
import { DragonfuryClientService } from './dragonfury-client.service';
import { ProviderDragonfuryService } from './provider-dragonfury.service';

@Module({
  imports: [AppConfigModule],
  providers: [VblinkSignatureService, DragonfuryClientService, ProviderDragonfuryService],
  exports: [ProviderDragonfuryService, DragonfuryClientService],
})
export class ProviderDragonfuryModule {}
