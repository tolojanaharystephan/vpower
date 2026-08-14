import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
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
}
