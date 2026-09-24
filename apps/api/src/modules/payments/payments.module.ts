import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { AllscaleApiClient } from './allscale-api.client';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AppConfigModule, WalletModule],
  controllers: [PaymentsController],
  providers: [AllscaleApiClient, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
