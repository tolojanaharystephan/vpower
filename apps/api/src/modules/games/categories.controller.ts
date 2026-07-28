import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators';
import { GamesService } from './games.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@ApiTags('game-categories')
@ApiBearerAuth()
@Controller('game-categories')
export class CategoriesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'List all game categories' })
  async findAll() {
    return this.gamesService.findAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.gamesService.findCategoryById(id);
  }

  @Post()
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Create a new category' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.gamesService.createCategory(dto);
  }

  @Put(':id')
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.gamesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('games:write')
  @ApiOperation({ summary: 'Soft delete a category' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    await this.gamesService.deleteCategory(id);
    return { success: true };
  }
}
