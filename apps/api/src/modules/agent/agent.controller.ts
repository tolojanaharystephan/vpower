import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { PERMISSIONS } from '../rbac/permissions.constants';
import { AgentOpsService } from './agent-ops.service';
import { ChatMessageDto, RevenueQueryDto, WalletAdjustDto } from './dto/agent.dto';

const imageUpload = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

@ApiTags('agent')
@ApiBearerAuth()
@Controller('agent')
export class AgentController {
  constructor(private readonly ops: AgentOpsService) {}

  @Get('me/rooms')
  @RequirePermissions(PERMISSIONS.AGENT_ACCESS)
  @ApiOperation({ summary: 'Rooms assigned to the current agent (or all for staff)' })
  myRooms(@CurrentUser() user: AuthUser) {
    return this.ops.listMyRooms(user);
  }

  @Get('rooms/:roomSlug/stats')
  @RequirePermissions(PERMISSIONS.WALLET_READ)
  roomStats(
    @CurrentUser() user: AuthUser,
    @Param('roomSlug') roomSlug: string,
    @Query() query: RevenueQueryDto,
  ) {
    return this.ops.roomStats(
      user,
      roomSlug,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Get('rooms/:roomSlug/players')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  players(@CurrentUser() user: AuthUser, @Param('roomSlug') roomSlug: string) {
    return this.ops.listRoomPlayers(user, roomSlug);
  }

  @Get('rooms/:roomSlug/players/:playerId')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  playerDetail(
    @CurrentUser() user: AuthUser,
    @Param('roomSlug') roomSlug: string,
    @Param('playerId') playerId: string,
  ) {
    return this.ops.getPlayerDetail(user, roomSlug, playerId);
  }

  @Get('rooms/:roomSlug/transactions')
  @RequirePermissions(PERMISSIONS.WALLET_READ)
  transactions(@CurrentUser() user: AuthUser, @Param('roomSlug') roomSlug: string) {
    return this.ops.listRoomTransactions(user, roomSlug);
  }

  @Post('rooms/:roomSlug/players/:playerId/credit')
  @RequirePermissions(PERMISSIONS.WALLET_CREDIT)
  credit(
    @CurrentUser() user: AuthUser,
    @Param('roomSlug') roomSlug: string,
    @Param('playerId') playerId: string,
    @Body() body: WalletAdjustDto,
  ) {
    return this.ops.creditPlayer(user, roomSlug, playerId, body.amountCents, body.note);
  }

  @Post('rooms/:roomSlug/players/:playerId/debit')
  @RequirePermissions(PERMISSIONS.WALLET_CREDIT)
  debit(
    @CurrentUser() user: AuthUser,
    @Param('roomSlug') roomSlug: string,
    @Param('playerId') playerId: string,
    @Body() body: WalletAdjustDto,
  ) {
    return this.ops.debitPlayer(user, roomSlug, playerId, body.amountCents, body.note);
  }

  @Get('conversations')
  @RequirePermissions(PERMISSIONS.SUPPORT_READ)
  conversations(@CurrentUser() user: AuthUser, @Query('roomSlug') roomSlug?: string) {
    return this.ops.listConversations(user, roomSlug);
  }

  @Get('conversations/:id/messages')
  @RequirePermissions(PERMISSIONS.SUPPORT_READ)
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ops.listMessages(user, id);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions(PERMISSIONS.SUPPORT_WRITE)
  @UseInterceptors(imageUpload)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        body: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async postMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: ChatMessageDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    if (image?.buffer?.length) {
      imageUrl = await this.ops.saveChatImage({
        buffer: image.buffer,
        mimetype: image.mimetype,
        originalname: image.originalname,
      });
    }
    const msg = await this.ops.postAgentMessage(user, id, body.body || '', imageUrl);
    return msg;
  }
}
