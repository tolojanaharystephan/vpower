import { Module } from '@nestjs/common';
import { RbacSeedService } from './rbac-seed.service';

@Module({
  providers: [RbacSeedService],
  exports: [RbacSeedService],
})
export class RbacModule {}
