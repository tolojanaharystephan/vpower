import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { Plus100ApiClient } from './plus100-api-client.service';
import { Provider100PlusController } from './provider-100plus.controller';
import { Provider100PlusService } from './provider-100plus.service';

@Module({
  imports: [AppConfigModule],
  controllers: [Provider100PlusController],
  providers: [Provider100PlusService, Plus100ApiClient],
  exports: [Provider100PlusService, Plus100ApiClient],
})
export class Provider100PlusModule {}
