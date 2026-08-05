import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, FavoritesService],
  exports: [UsersService, FavoritesService],
})
export class UsersModule {}
