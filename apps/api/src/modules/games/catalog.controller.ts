import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { GamesService } from './games.service';
import { QueryCatalogGamesDto } from './dto/query-catalog-games.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly gamesService: GamesService) {}

  @Public()
  @Get('games')
  @ApiOperation({ summary: 'Public catalog — active games only' })
  async listGames(@Query() query: QueryCatalogGamesDto) {
    return this.gamesService.findCatalogGames(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Public catalog — active categories' })
  async listCategories() {
    return this.gamesService.findActiveCategories();
  }
}
