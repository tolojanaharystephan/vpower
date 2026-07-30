import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import {
  AddMessageDto,
  BotChatDto,
  BotEscalateDto,
  CreateTicketDto,
  QueryTicketsDto,
  TranslateMessageDto,
  UpdateTicketDto,
} from './dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('bot/chat')
  @ApiOperation({ summary: 'Ask the quick-answer support bot (FAQ)' })
  async botChat(@Body() body: BotChatDto) {
    return this.support.askBot(body);
  }

  @Post('bot/escalate')
  @ApiOperation({ summary: 'Escalate bot conversation to a human ticket' })
  async botEscalate(@CurrentUser() user: AuthUser, @Body() body: BotEscalateDto) {
    return this.support.escalateFromBot(user.id, body);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket (player)' })
  async create(@CurrentUser() user: AuthUser, @Body() body: CreateTicketDto) {
    return this.support.create(user.id, body);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List my support tickets' })
  async listMine(@CurrentUser() user: AuthUser, @Query() query: QueryTicketsDto) {
    return this.support.listMine(user.id, query);
  }

  @Get('admin/tickets')
  @RequirePermissions('support:read')
  @ApiOperation({ summary: 'Admin support inbox' })
  async listAll(@Query() query: QueryTicketsDto) {
    return this.support.listAll(query);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket thread (owner or support:read)' })
  @ApiParam({ name: 'id', type: String })
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: QueryTicketsDto,
  ) {
    return this.support.getOne(id, user, query.targetLang);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a text message to a ticket' })
  @ApiParam({ name: 'id', type: String })
  async addMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddMessageDto,
    @Query() query: QueryTicketsDto,
  ) {
    return this.support.addMessage(id, user, body.body, {
      sourceLangHint: body.sourceLangHint,
      targetLang: query.targetLang,
    });
  }

  @Post('tickets/:id/messages/voice')
  @ApiOperation({ summary: 'Add a voice message to a ticket' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
        caption: { type: 'string' },
      },
      required: ['audio'],
    },
  })
  @ApiParam({ name: 'id', type: String })
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async addVoice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('caption') caption: string | undefined,
    @Query() query: QueryTicketsDto,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Audio file is required');
    }
    return this.support.addVoiceMessage(
      id,
      user,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      { caption, targetLang: query.targetLang },
    );
  }

  @Post('tickets/:id/messages/:messageId/translate')
  @ApiOperation({ summary: 'Translate a message to any target language' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'messageId', type: String })
  async translate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: TranslateMessageDto,
  ) {
    return this.support.translateMessage(id, messageId, user, body.targetLang);
  }

  @Patch('tickets/:id')
  @RequirePermissions('support:write')
  @ApiOperation({ summary: 'Update ticket status/priority (staff)' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() body: UpdateTicketDto) {
    return this.support.updateTicket(id, body);
  }
}
