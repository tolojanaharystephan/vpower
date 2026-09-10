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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { AgentOpsService } from './agent-ops.service';
import { ChatMessageDto } from './dto/agent.dto';

const imageUpload = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

/** Player-facing room chat (deposit proof / talk to room agent). */
@ApiTags('room-chat')
@ApiBearerAuth()
@Controller('support/rooms')
export class PlayerRoomChatController {
  constructor(private readonly ops: AgentOpsService) {}

  @Get(':roomSlug/conversation')
  @ApiOperation({ summary: 'Get or create chat with the room agent' })
  getConversation(@CurrentUser() user: AuthUser, @Param('roomSlug') roomSlug: string) {
    return this.ops.playerListMessages(user.id, roomSlug);
  }

  @Post(':roomSlug/conversation/messages')
  @UseInterceptors(imageUpload)
  @ApiConsumes('multipart/form-data', 'application/json')
  async postMessage(
    @CurrentUser() user: AuthUser,
    @Param('roomSlug') roomSlug: string,
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
    return this.ops.playerPostMessage(user.id, roomSlug, body.body || '', imageUrl);
  }
}
