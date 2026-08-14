import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { AppConfigService } from '../../config/app-config.service';
import type { Database } from '../../database/database';
import { DRIZZLE } from '../../database/database.constants';
import { userWallets, walletTransactions } from '../../database/schema';

@Injectable()
export class WalletService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: AppConfigService,
  ) {}

  async getOrCreate(userId: string) {
    const [existing] = await this.db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);
    if (existing) return existing;

    const [created] = await this.db
      .insert(userWallets)
      .values({ userId, balanceCents: 0 })
      .onConflictDoNothing()
      .returning();
    if (created) return created;

    const [again] = await this.db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);
    if (!again) throw new ServiceUnavailableException('Wallet unavailable');
    return again;
  }

  async getBalanceCents(userId: string): Promise<number> {
    const wallet = await this.getOrCreate(userId);
    return wallet.balanceCents;
  }

  /** Dev / pre-Stripe top-up so money can live on VPower before VBlink transfer. */
  async devCredit(userId: string, amountCents: number) {
    if (this.config.isProduction) {
      throw new ServiceUnavailableException('Dev wallet credit disabled in production');
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    return this.credit(userId, amountCents, 'dev_credit', `dev-${Date.now()}`);
  }

  async credit(userId: string, amountCents: number, kind: string, reference?: string) {
    if (amountCents <= 0) throw new BadRequestException('credit amount must be positive');
    await this.getOrCreate(userId);
    return this.db.transaction(async (tx) => {
      const [wallet] = await tx
        .update(userWallets)
        .set({
          balanceCents: sql`${userWallets.balanceCents} + ${amountCents}`,
          updatedAt: new Date(),
        })
        .where(eq(userWallets.userId, userId))
        .returning();
      await tx.insert(walletTransactions).values({
        userId,
        amountCents,
        kind,
        reference,
      });
      return wallet!;
    });
  }

  async debit(userId: string, amountCents: number, kind: string, reference?: string) {
    if (amountCents <= 0) throw new BadRequestException('debit amount must be positive');
    await this.getOrCreate(userId);
    return this.db.transaction(async (tx) => {
      const [wallet] = await tx
        .update(userWallets)
        .set({
          balanceCents: sql`${userWallets.balanceCents} - ${amountCents}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userWallets.userId, userId),
            sql`${userWallets.balanceCents} >= ${amountCents}`,
          ),
        )
        .returning();
      if (!wallet) {
        throw new BadRequestException('Insufficient VPower wallet balance');
      }
      await tx.insert(walletTransactions).values({
        userId,
        amountCents: -amountCents,
        kind,
        reference,
      });
      return wallet;
    });
  }

  formatDollars(cents: number): string {
    return (cents / 100).toFixed(2);
  }
}
