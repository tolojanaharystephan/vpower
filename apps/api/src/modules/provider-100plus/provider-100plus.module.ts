import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { Provider100PlusController } from './provider-100plus.controller';
import { Provider100PlusService } from './provider-100plus.service';

@Module({
  imports: [AppConfigModule],
  controllers: [Provider100PlusController],
  providers: [Provider100PlusService],
  exports: [Provider100PlusService],
})
export class Provider100PlusModule {}
