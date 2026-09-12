import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { ProviderDgamesService } from './provider-dgames.service';

@ApiTags('platforms')
@ApiBearerAuth()
@Controller('platforms/dgames')
export class DgamesPlatformsController {
  constructor(private readonly dgames: ProviderDgamesService) {}

  @Post('enter')
  @ApiOperation({ summary: 'Enter DGames: ensure player mapping, launch first game if available' })
  enter(@CurrentUser() user: AuthUser, @Query('locale') locale?: string) {
    return this.dgames.enterLobby(user.id, locale);
  }

  @Get('games')
  @ApiOperation({ summary: 'List DGames catalog (getGamesList)' })
  games() {
    return this.dgames.listGames();
  }

  @Post('games/:gameId/launch')
  @ApiOperation({ summary: 'Open a DGames title (openGame)' })
  launch(
    @CurrentUser() user: AuthUser,
    @Param('gameId') gameId: string,
    @Query('locale') locale?: string,
  ) {
    return this.dgames.launchGame(user.id, gameId, locale);
  }
}
