import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type Redis from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import type { Database } from '../../database/database';
import { DRIZZLE } from '../../database/database.constants';
import { paymentOrders, users } from '../../database/schema';
import { REDIS } from '../../redis/redis.constants';
import { WalletService } from '../wallet/wallet.service';
import { AllscaleApiClient } from './allscale-api.client';
import {
  isWebhookTimestampFresh,
  verifyAllscaleWebhookSignature,
} from './allscale-signing';

export type AllscaleWebhookBody = {
  all_scale_transaction_id?: string;
  all_scale_checkout_intent_id?: string;
  webhook_id?: string;
  amount_cents?: number;
  currency?: number | null;
  order_id?: string | null;
  user_id?: string | null;
  [key: string]: unknown;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly allscale: AllscaleApiClient,
    private readonly wallets: WalletService,
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  assertPaymentsEnabled() {
    if (!this.config.featureFlags.paymentsEnabled) {
      throw new ServiceUnavailableException('Payments are disabled');
    }
    if (!this.allscale.isConfigured()) {
      throw new ServiceUnavailableException('AllScale credentials are not configured');
    }
  }

  async createCheckout(input: {
    userId: string;
    roomSlug: string;
    amountCents: number;
    locale?: string;
  }) {
    this.assertPaymentsEnabled();
    const roomSlug = this.wallets.parseRoomSlug(input.roomSlug);
    if (!Number.isInteger(input.amountCents) || input.amountCents < 100) {
      throw new BadRequestException('amountCents must be at least 100 ($1.00)');
    }

    const [user] = await this.db
      .select({
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const orderId = `vp_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const locale = (input.locale || 'fr').replace(/[^a-z-]/gi, '') || 'fr';
    const redirectUrl = `${this.config.appUrl.replace(/\/$/, '')}/${locale}/account?deposit=ok&order=${encodeURIComponent(orderId)}`;

    const intent = await this.allscale.createCheckoutIntent({
      amountCents: input.amountCents,
      orderId,
      userId: input.userId,
      userName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email,
      redirectUrl,
      roomSlug,
    });

    await this.db.insert(paymentOrders).values({
      orderId,
      userId: input.userId,
      roomSlug,
      amountCents: input.amountCents,
      status: 'pending',
      provider: 'allscale',
      checkoutIntentId: intent.checkoutIntentId,
      checkoutUrl: intent.checkoutUrl,
    });

    return {
      orderId,
      checkoutUrl: intent.checkoutUrl,
      checkoutIntentId: intent.checkoutIntentId,
      amountCents: input.amountCents,
      roomSlug,
      currency: 'USD' as const,
    };
  }

  async handleAllscaleWebhook(input: {
    method: string;
    path: string;
    query: string;
    headers: Record<string, string | undefined>;
    rawBody: Buffer;
  }): Promise<{ ok: true; duplicate?: boolean }> {
    this.assertPaymentsEnabled();

    const apiKey = input.headers['x-api-key']?.trim() || '';
    const webhookId = input.headers['x-webhook-id']?.trim() || '';
    const timestamp = input.headers['x-webhook-timestamp']?.trim() || '';
    const nonce = input.headers['x-webhook-nonce']?.trim() || '';
    const signature = input.headers['x-webhook-signature']?.trim() || '';

    if (!apiKey || !webhookId || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException('Missing AllScale webhook headers');
    }
    if (apiKey !== this.config.allscale.apiKey) {
      throw new UnauthorizedException('Invalid AllScale API key');
    }
    if (!isWebhookTimestampFresh(timestamp)) {
      throw new UnauthorizedException('Webhook timestamp out of range');
    }

    const nonceKey = `allscale:webhook:nonce:${nonce}`;
    const nonceSet = await this.redis.set(nonceKey, '1', 'EX', 600, 'NX');
    if (nonceSet !== 'OK') {
      throw new UnauthorizedException('Webhook nonce replay');
    }

    const valid = verifyAllscaleWebhookSignature({
      apiSecret: this.config.allscale.apiSecret,
      method: input.method,
      path: input.path,
      query: input.query,
      webhookId,
      timestamp,
      nonce,
      rawBody: input.rawBody,
      signatureHeader: signature,
    });
    if (!valid) {
      await this.redis.del(nonceKey);
      throw new UnauthorizedException('Invalid AllScale webhook signature');
    }

    let body: AllscaleWebhookBody;
    try {
      body = JSON.parse(input.rawBody.toString('utf8')) as AllscaleWebhookBody;
    } catch {
      throw new BadRequestException('Invalid webhook JSON');
    }

    if (body.webhook_id && body.webhook_id !== webhookId) {
      throw new BadRequestException('webhook_id mismatch');
    }

    const orderId = String(body.order_id || '').trim();
    const intentId = String(body.all_scale_checkout_intent_id || '').trim();
    const transactionId = String(body.all_scale_transaction_id || '').trim();
    if (!orderId || !intentId || !transactionId) {
      throw new BadRequestException('Missing order/intent/transaction id');
    }

    const [existingByWebhook] = await this.db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.webhookId, webhookId))
      .limit(1);
    if (existingByWebhook?.status === 'paid') {
      return { ok: true, duplicate: true };
    }

    const [order] = await this.db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.orderId, orderId))
      .limit(1);
    if (!order) {
      throw new BadRequestException('Unknown order_id');
    }
    if (order.status === 'paid') {
      return { ok: true, duplicate: true };
    }
    if (order.checkoutIntentId && order.checkoutIntentId !== intentId) {
      throw new BadRequestException('checkout intent mismatch');
    }
    if (order.userId && body.user_id && String(body.user_id) !== order.userId) {
      throw new BadRequestException('user_id mismatch');
    }

    const amountCents = Number(body.amount_cents);
    if (!Number.isInteger(amountCents) || amountCents !== order.amountCents) {
      throw new BadRequestException('amount_cents mismatch');
    }

    // Claim the order first (single-winner) then credit — avoids double deposit on webhook retry.
    const [claimed] = await this.db
      .update(paymentOrders)
      .set({
        status: 'paid',
        transactionId,
        webhookId,
        checkoutIntentId: intentId,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(paymentOrders.id, order.id), eq(paymentOrders.status, 'pending')))
      .returning();

    if (!claimed) {
      this.logger.log(`AllScale webhook duplicate for order ${orderId}`);
      return { ok: true, duplicate: true };
    }

    try {
      await this.wallets.credit(
        order.userId,
        order.roomSlug,
        order.amountCents,
        'allscale_deposit',
        `allscale:${transactionId}`,
      );
    } catch (err) {
      await this.db
        .update(paymentOrders)
        .set({
          status: 'pending',
          transactionId: null,
          webhookId: null,
          paidAt: null,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, order.id));
      throw err;
    }

    this.logger.log(
      `AllScale deposit paid order=${orderId} user=${order.userId} room=${order.roomSlug} cents=${order.amountCents} tx=${transactionId}`,
    );
    return { ok: true };
  }
}
