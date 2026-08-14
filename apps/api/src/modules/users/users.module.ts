import { Module, forwardRef } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { GameIntegrationModule } from '../game-integration/game-integration.module';
import { FavoritesService } from './favorites.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AppConfigModule, forwardRef(() => GameIntegrationModule)],
  controllers: [UsersController],
  providers: [UsersService, FavoritesService],
  exports: [UsersService, FavoritesService],
})
export class UsersModule {}
