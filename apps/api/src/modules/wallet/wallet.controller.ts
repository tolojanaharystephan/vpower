import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { DevCreditDto } from './dto/dev-credit.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'All room wallets for the current player' })
  async me(@CurrentUser() user: AuthUser) {
    return this.wallet.listForUser(user.id);
  }

  @Get('me/:roomSlug')
  @ApiOperation({ summary: 'One room wallet' })
  async meRoom(@CurrentUser() user: AuthUser, @Param('roomSlug') roomSlug: string) {
    const slug = this.wallet.parseRoomSlug(roomSlug);
    const listed = await this.wallet.listForUser(user.id);
    const room = listed.wallets.find((w) => w.roomSlug === slug)!;
    return { currency: listed.currency, ...room };
  }

  @Post('dev-credit')
  @ApiOperation({
    summary: 'Dev-only: credit a room wallet (pre-Stripe). Disabled in production.',
  })
  async devCredit(@CurrentUser() user: AuthUser, @Body() body: DevCreditDto) {
    const amountCents = body.amountCents ?? 10_000;
    const listed = await this.wallet.devCredit(user.id, body.roomSlug, amountCents);
    const room = listed.wallets.find((w) => w.roomSlug === body.roomSlug)!;
    return {
      ...listed,
      roomSlug: room.roomSlug,
      balanceCents: room.balanceCents,
      balance: room.balance,
      creditedCents: amountCents,
    };
  }
}
