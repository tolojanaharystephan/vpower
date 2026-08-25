import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { LaunchGameDto } from './dto/launch-game.dto';
import { GameIntegrationService } from './game-integration.service';

@ApiTags('platforms')
@ApiBearerAuth()
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly integration: GameIntegrationService) {}

  @Post('vblink/enter')
  @ApiOperation({
    summary:
      'Enter VBlink casino (partner site): provision player, push VPower credits, return Game Mainpage URL',
  })
  enterVblink(@CurrentUser() user: AuthUser) {
    return this.integration.enterVblink(user.id);
  }

  @Post('100plus/enter')
  @ApiOperation({
    summary: 'Enter 100plus lobby: create player if needed, return clientUrl',
  })
  enterPlus100(@CurrentUser() user: AuthUser, @Body() body: LaunchGameDto = {}) {
    return this.integration.enterPlus100(user.id, body.locale);
  }
}
