import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AgentModule } from '../agent/agent.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSeedService } from './admin-seed.service';
import { AgentSeedService } from './agent-seed.service';

@Module({
  imports: [UsersModule, AgentModule],
  controllers: [AdminController],
  providers: [AdminService, AdminSeedService, AgentSeedService],
})
export class AdminModule {}
