import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { CategoriesController } from './categories.controller';
import { ProvidersController } from './providers.controller';
import { GamesService } from './games.service';

@Module({
  controllers: [GamesController, CategoriesController, ProvidersController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
