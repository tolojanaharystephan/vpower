import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FavoritesService } from './favorites.service';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly favorites: FavoritesService,
  ) {}

  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List users (admin)' })
  async list(@Query() query: QueryUsersDto) {
    return this.users.listUsers(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user profile' })
  async me(@CurrentUser() authUser: AuthUser) {
    const user = await this.users.findById(authUser.id);
    if (!user) throw new NotFoundException('User not found');
    return {
      ...this.users.toPublic(user),
      roles: authUser.roles,
      permissions: authUser.permissions,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() authUser: AuthUser, @Body() body: UpdateProfileDto) {
    const user = await this.users.updateProfile(authUser.id, body);
    return {
      ...this.users.toPublic(user),
      roles: authUser.roles,
      permissions: authUser.permissions,
    };
  }

  @Get('me/favorites')
  @ApiOperation({ summary: 'List favorite games for current user' })
  async listFavorites(@CurrentUser() authUser: AuthUser) {
    return this.favorites.listForUser(authUser.id);
  }

  @Post('me/favorites/:gameId')
  @ApiOperation({ summary: 'Add a game to favorites' })
  @ApiParam({ name: 'gameId', type: String })
  async addFavorite(@CurrentUser() authUser: AuthUser, @Param('gameId') gameId: string) {
    return this.favorites.add(authUser.id, gameId);
  }

  @Delete('me/favorites/:gameId')
  @ApiOperation({ summary: 'Remove a game from favorites' })
  @ApiParam({ name: 'gameId', type: String })
  async removeFavorite(@CurrentUser() authUser: AuthUser, @Param('gameId') gameId: string) {
    return this.favorites.remove(authUser.id, gameId);
  }
}
