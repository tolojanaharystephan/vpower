import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ROOM_SLUGS, isRoomSlug, type RoomSlug } from '@vpower777/types';
import { eq, sql, and } from 'drizzle-orm';
import type { Database } from '../../database/database';
import { DRIZZLE } from '../../database/database.constants';
import { userWallets, walletTransactions, type UserWallet } from '../../database/schema';

/** One spendable balance. Room slugs stay on transactions to say which game was played. */
export const CASHIER_SLUG = 'cashier';

export type RoomWalletDto = {
  roomSlug: string;
  name: string;
  balanceCents: number;
  balance: string;
};

@Injectable()
export class WalletService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  parseRoomSlug(value: string): RoomSlug {
    if (!isRoomSlug(value)) {
      throw new BadRequestException(`Unknown room: ${value}`);
    }
    return value;
  }

  async ensureAllRooms(userId: string): Promise<UserWallet[]> {
    await this.db
      .insert(userWallets)
      .values(ROOM_SLUGS.map((roomSlug) => ({ userId, roomSlug, balanceCents: 0 })))
      .onConflictDoNothing({ target: [userWallets.userId, userWallets.roomSlug] });

    const rows = await this.db.select().from(userWallets).where(eq(userWallets.userId, userId));
    const bySlug = new Map(rows.map((row) => [row.roomSlug, row]));
    return ROOM_SLUGS.map((slug) => {
      const row = bySlug.get(slug);
      if (!row) throw new ServiceUnavailableException('Wallet unavailable');
      return row;
    });
  }

  async getOrCreate(userId: string, roomSlug: string) {
    const slug = this.parseRoomSlug(roomSlug);
    const [existing] = await this.db
      .select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.roomSlug, slug)))
      .limit(1);
    if (existing) return existing;

    const [created] = await this.db
      .insert(userWallets)
      .values({ userId, roomSlug: slug, balanceCents: 0 })
      .onConflictDoNothing({ target: [userWallets.userId, userWallets.roomSlug] })
      .returning();
    if (created) return created;

    const [again] = await this.db
      .select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.roomSlug, slug)))
      .limit(1);
    if (!again) throw new ServiceUnavailableException('Wallet unavailable');
    return again;
  }

  async getBalanceCents(userId: string, _roomSlug?: string): Promise<number> {
    const wallet = await this.ensureCashier(userId);
    return wallet.balanceCents;
  }

  async listForUser(userId: string) {
    await this.ensureAllRooms(userId);
    const cashier = await this.ensureCashier(userId);
    return {
      currency: 'USD' as const,
      wallets: [this.toCashierDto(cashier)],
    };
  }

  private async ensureCashier(userId: string): Promise<UserWallet> {
    const [existing] = await this.db
      .select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.roomSlug, CASHIER_SLUG)))
      .limit(1);
    if (existing) return existing;

    const [created] = await this.db
      .insert(userWallets)
      .values({ userId, roomSlug: CASHIER_SLUG, balanceCents: 0 })
      .onConflictDoNothing({ target: [userWallets.userId, userWallets.roomSlug] })
      .returning();
    if (created) return created;

    const [again] = await this.db
      .select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.roomSlug, CASHIER_SLUG)))
      .limit(1);
    if (!again) throw new ServiceUnavailableException('Wallet unavailable');
    return again;
  }

  /** Test top-up. Retired: balances come from AllScale or a room agent. */
  async devCredit(_userId: string, _roomSlug: string, _amountCents: number): Promise<never> {
    throw new ServiceUnavailableException('Test wallet credit is disabled');
  }

  async credit(
    userId: string,
    roomSlug: string,
    amountCents: number,
    kind: string,
    reference?: string,
    createdByUserId?: string,
  ) {
    const slug = roomSlug === CASHIER_SLUG ? CASHIER_SLUG : this.parseRoomSlug(roomSlug);
    if (amountCents <= 0) throw new BadRequestException('credit amount must be positive');
    await this.ensureCashier(userId);
    return this.db.transaction(async (tx) => {
      const [wallet] = await tx
        .update(userWallets)
        .set({
          balanceCents: sql`${userWallets.balanceCents} + ${amountCents}`,
          updatedAt: new Date(),
        })
        .where(and(eq(userWallets.userId, userId), eq(userWallets.roomSlug, CASHIER_SLUG)))
        .returning();
      await tx.insert(walletTransactions).values({
        userId,
        roomSlug: slug,
        amountCents,
        kind,
        reference,
        createdByUserId: createdByUserId ?? null,
      });
      return wallet!;
    });
  }

  async debit(
    userId: string,
    roomSlug: string,
    amountCents: number,
    kind: string,
    reference?: string,
    createdByUserId?: string,
  ) {
    const slug = this.parseRoomSlug(roomSlug);
    if (amountCents <= 0) throw new BadRequestException('debit amount must be positive');
    await this.ensureCashier(userId);
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
            eq(userWallets.roomSlug, CASHIER_SLUG),
            sql`${userWallets.balanceCents} >= ${amountCents}`,
          ),
        )
        .returning();
      if (!wallet) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      await tx.insert(walletTransactions).values({
        userId,
        roomSlug: slug,
        amountCents: -amountCents,
        kind,
        reference,
        createdByUserId: createdByUserId ?? null,
      });
      return wallet;
    });
  }

  /**
   * GamesAPI writeBet: subtract bet then add win in one atomic update.
   * When `skipBalanceCheck` (refund), allow the balance to go negative.
   */
  async applyBetWin(
    userId: string,
    roomSlug: string,
    betCents: number,
    winCents: number,
    reference?: string,
    opts?: { skipBalanceCheck?: boolean },
  ) {
    const slug = this.parseRoomSlug(roomSlug);
    if (betCents < 0 || winCents < 0) {
      throw new BadRequestException('bet/win must be non-negative');
    }
    await this.ensureCashier(userId);
    const delta = winCents - betCents;
    return this.db.transaction(async (tx) => {
      const conditions = [eq(userWallets.userId, userId), eq(userWallets.roomSlug, CASHIER_SLUG)];
      if (!opts?.skipBalanceCheck && betCents > 0) {
        conditions.push(sql`${userWallets.balanceCents} >= ${betCents}`);
      }
      const [wallet] = await tx
        .update(userWallets)
        .set({
          balanceCents: sql`${userWallets.balanceCents} + ${delta}`,
          updatedAt: new Date(),
        })
        .where(and(...conditions))
        .returning();
      if (!wallet) {
        throw new BadRequestException('fail_balance');
      }
      await tx.insert(walletTransactions).values({
        userId,
        roomSlug: slug,
        amountCents: delta,
        kind: 'dgames_bet',
        reference: reference ?? null,
      });
      return wallet;
    });
  }

  async listTransactions(userId: string, roomSlug: string, limit = 50) {
    const slug = this.parseRoomSlug(roomSlug);
    return this.db
      .select()
      .from(walletTransactions)
      .where(and(eq(walletTransactions.userId, userId), eq(walletTransactions.roomSlug, slug)))
      .orderBy(sql`${walletTransactions.createdAt} desc`)
      .limit(limit);
  }

  formatDollars(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  private toCashierDto(row: UserWallet): RoomWalletDto {
    return {
      roomSlug: CASHIER_SLUG,
      name: 'Cashier',
      balanceCents: row.balanceCents,
      balance: this.formatDollars(row.balanceCents),
    };
  }
}
