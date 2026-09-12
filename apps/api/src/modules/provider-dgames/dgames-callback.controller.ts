import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import {
  DgamesCallbackService,
  type DgamesCallbackBody,
} from './dgames-callback.service';

@ApiTags('dgames')
@Controller('providers/dgames')
export class DgamesCallbackController {
  constructor(private readonly callbacks: DgamesCallbackService) {}

  @Public()
  @Post('callback')
  @ApiOperation({
    summary: 'DGames GamesAPI hall callback (getBalance / writeBet)',
  })
  handle(@Body() body: DgamesCallbackBody) {
    return this.callbacks.handle(body ?? {});
  }
}
