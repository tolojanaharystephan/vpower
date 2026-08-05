import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TranslationModule } from '../translation/translation.module';
import { SupportBotService } from './support-bot.service';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportMediaService } from './support-media.service';
import { SupportService } from './support.service';

@Module({
  imports: [AuthModule, TranslationModule, NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService, SupportGateway, SupportBotService, SupportMediaService],
  exports: [SupportService, SupportGateway],
})
export class SupportModule {}
