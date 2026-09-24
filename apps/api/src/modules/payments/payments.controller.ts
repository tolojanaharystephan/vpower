import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, Public } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('checkout')
  @ApiOperation({ summary: 'Create AllScale checkout intent and return hosted URL' })
  async checkout(@CurrentUser() user: AuthUser, @Body() body: CreateCheckoutDto) {
    return this.payments.createCheckout({
      userId: user.id,
      roomSlug: body.roomSlug,
      amountCents: body.amountCents,
    });
  }

  @Public()
  @Post('allscale/webhook')
  @ApiOperation({ summary: 'AllScale signed payment webhook' })
  async allscaleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing raw body for webhook verification');
    }

    const original = req.originalUrl || req.url || '';
    const qIndex = original.indexOf('?');
    const path = qIndex >= 0 ? original.slice(0, qIndex) : original;
    const query = qIndex >= 0 ? original.slice(qIndex + 1) : '';

    return this.payments.handleAllscaleWebhook({
      method: req.method,
      path,
      query,
      headers: {
        'x-api-key': headers['x-api-key'],
        'x-webhook-id': headers['x-webhook-id'],
        'x-webhook-timestamp': headers['x-webhook-timestamp'],
        'x-webhook-nonce': headers['x-webhook-nonce'],
        'x-webhook-signature': headers['x-webhook-signature'],
      },
      rawBody,
    });
  }
}
