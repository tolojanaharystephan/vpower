import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators';
import { GamesService } from './games.service';
import { CreateProviderDto, UpdateProviderDto } from './dto';

@ApiTags('game-providers')
@ApiBearerAuth()
@Controller('game-providers')
export class ProvidersController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'List all game providers' })
  async findAll() {
    return this.gamesService.findAllProviders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.gamesService.findProviderById(id);
  }

  @Post()
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Create a new provider' })
  async create(@Body() dto: CreateProviderDto) {
    return this.gamesService.createProvider(dto);
  }

  @Put(':id')
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Update a provider' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.gamesService.updateProvider(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Delete a provider' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    await this.gamesService.deleteProvider(id);
    return { success: true };
  }
}
