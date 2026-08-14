import { Body, Controller, Get, Post } from '@nestjs/common';
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
  @ApiOperation({ summary: 'VPower wallet balance (money stays on VPower until game transfer)' })
  async me(@CurrentUser() user: AuthUser) {
    const balanceCents = await this.wallet.getBalanceCents(user.id);
    return {
      balanceCents,
      balance: this.wallet.formatDollars(balanceCents),
      currency: 'USD',
    };
  }

  @Post('dev-credit')
  @ApiOperation({
    summary: 'Dev-only: credit VPower wallet (pre-Stripe). Disabled in production.',
  })
  async devCredit(@CurrentUser() user: AuthUser, @Body() body: DevCreditDto) {
    const amountCents = body.amountCents ?? 10_000; // $100 default for tests
    const wallet = await this.wallet.devCredit(user.id, amountCents);
    return {
      balanceCents: wallet.balanceCents,
      balance: this.wallet.formatDollars(wallet.balanceCents),
      creditedCents: amountCents,
    };
  }
}
