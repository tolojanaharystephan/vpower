import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators';
import { GamesService } from './games.service';
import { CreateGameDto, UpdateGameDto, QueryGamesDto } from './dto';

@ApiTags('games')
@ApiBearerAuth()
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'List games with filtering and pagination' })
  async findAll(@Query() query: QueryGamesDto) {
    return this.gamesService.findAllGames(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.gamesService.findGameById(id);
  }

  @Post()
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Create a new game' })
  async create(@Body() dto: CreateGameDto) {
    return this.gamesService.createGame(dto);
  }

  @Put(':id')
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Update a game' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.updateGame(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Soft delete a game' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    await this.gamesService.deleteGame(id);
    return { success: true };
  }
}
