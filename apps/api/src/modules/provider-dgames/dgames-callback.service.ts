import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { AppConfigService } from '../../config/app-config.service';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { dgamesBetTrades, providerPlayerAccounts } from '../../database/schema';
import { WalletService } from '../wallet/wallet.service';

export const DGAMES_PROVIDER_SLUG = 'dgames';
export const DGAMES_ROOM_SLUG = 'dgames';

export type DgamesCallbackBody = {
  cmd?: string;
  hall?: string | number;
  key?: string;
  login?: string;
  bet?: string | number;
  win?: string | number;
  tradeId?: string | number;
  sessionId?: string | number;
  gameId?: string | number;
  betInfo?: string;
  action?: string;
  [key: string]: unknown;
};

@Injectable()
export class DgamesCallbackService {
  private readonly logger = new Logger(DgamesCallbackService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: AppConfigService,
    private readonly wallets: WalletService,
  ) {}

  async handle(body: DgamesCallbackBody) {
    const cmd = String(body.cmd || '');
    if (!this.authOk(body)) {
      return this.fail('user_not_found');
    }
    if (cmd === 'getBalance') return this.getBalance(body);
    if (cmd === 'writeBet') return this.writeBet(body);
    return this.fail('user_not_found');
  }

  private authOk(body: DgamesCallbackBody): boolean {
    const c = this.config.dgames;
    if (!c.hallId || !c.hallKey) return false;
    return String(body.hall ?? '') === c.hallId && String(body.key ?? '') === c.hallKey;
  }

  private async resolveUserId(login: string): Promise<string | null> {
    const [row] = await this.db
      .select()
      .from(providerPlayerAccounts)
      .where(
        and(
          eq(providerPlayerAccounts.providerSlug, DGAMES_PROVIDER_SLUG),
          eq(providerPlayerAccounts.externalAccount, login),
        ),
      )
      .limit(1);
    return row?.userId ?? null;
  }

  private async getBalance(body: DgamesCallbackBody) {
    const login = String(body.login || '');
    const userId = await this.resolveUserId(login);
    if (!userId) return this.fail('user_not_found');
    const cents = await this.wallets.getBalanceCents(userId, DGAMES_ROOM_SLUG);
    return this.ok(login, cents);
  }

  private async writeBet(body: DgamesCallbackBody) {
    const login = String(body.login || '');
    const userId = await this.resolveUserId(login);
    if (!userId) return this.fail('user_not_found');

    const tradeId = body.tradeId != null ? String(body.tradeId) : '';
    if (tradeId) {
      const [existing] = await this.db
        .select()
        .from(dgamesBetTrades)
        .where(eq(dgamesBetTrades.tradeId, tradeId))
        .limit(1);
      if (existing) {
        return this.ok(login, existing.balanceAfterCents);
      }
    }

    const betCents = toCents(body.bet);
    const winCents = toCents(body.win);
    const betInfo = String(body.betInfo || '').toLowerCase();
    const skipBalanceCheck = betInfo.includes('refund');

    try {
      const wallet = await this.wallets.applyBetWin(
        userId,
        DGAMES_ROOM_SLUG,
        betCents,
        winCents,
        tradeId || `dgames-${Date.now()}`,
        { skipBalanceCheck },
      );

      if (tradeId) {
        try {
          await this.db.insert(dgamesBetTrades).values({
            tradeId,
            userId,
            login,
            betCents,
            winCents,
            balanceAfterCents: wallet.balanceCents,
            sessionId: body.sessionId != null ? String(body.sessionId) : null,
            gameId: body.gameId != null ? String(body.gameId) : null,
          });
        } catch (err) {
          // Race: another request inserted the same tradeId — return that balance.
          const [again] = await this.db
            .select()
            .from(dgamesBetTrades)
            .where(eq(dgamesBetTrades.tradeId, tradeId))
            .limit(1);
          if (again) return this.ok(login, again.balanceAfterCents);
          this.logger.warn(`dgames trade insert failed: ${String(err)}`);
        }
      }

      return this.ok(login, wallet.balanceCents);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('fail_balance') || msg.toLowerCase().includes('insufficient')) {
        return this.fail('fail_balance');
      }
      this.logger.error(`writeBet error for ${login}: ${msg}`);
      return this.fail('fail_balance');
    }
  }

  private ok(login: string, balanceCents: number) {
    return {
      status: 'success',
      error: '',
      login,
      balance: this.wallets.formatDollars(balanceCents),
      currency: this.config.dgames.currency,
    };
  }

  private fail(error: string) {
    return { status: 'fail', error };
  }
}

/** Decimal dollars → integer cents (12,2). */
export function toCents(value: string | number | undefined | null): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
