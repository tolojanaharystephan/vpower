import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { LaunchGameDto } from './dto/launch-game.dto';
import { GameIntegrationService } from './game-integration.service';

@ApiTags('game-integration')
@ApiBearerAuth()
@Controller('games')
export class GameIntegrationController {
  constructor(private readonly integration: GameIntegrationService) {}

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch game session via VBlink (create player + Game Mainpage)' })
  @ApiParam({ name: 'id', type: String })
  async launch(
    @Param('id') id: string,
    @Body() body: LaunchGameDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integration.launchSession({
      gameId: id,
      userId: user.id,
      locale: body.locale,
    });
  }
}
