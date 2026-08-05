import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { CategoriesController } from './categories.controller';
import { ProvidersController } from './providers.controller';
import { CatalogController } from './catalog.controller';
import { GamesService } from './games.service';
import { GamesSeedService } from './games-seed.service';

@Module({
  controllers: [GamesController, CategoriesController, ProvidersController, CatalogController],
  providers: [GamesService, GamesSeedService],
  exports: [GamesService],
})
export class GamesModule {}
