import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { AgentOpsService } from './agent-ops.service';
import { AgentController } from './agent.controller';
import { PlayerRoomChatController } from './player-room-chat.controller';

@Module({
  imports: [WalletModule],
  controllers: [AgentController, PlayerRoomChatController],
  providers: [AgentOpsService],
  exports: [AgentOpsService],
})
export class AgentModule {}
