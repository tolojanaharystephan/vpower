import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ROOM_NAMES, ROOM_SLUGS, isRoomSlug, type RoomSlug } from '@vpower777/types';
import { eq, sql, and } from 'drizzle-orm';
import { AppConfigService } from '../../config/app-config.service';
import type { Database } from '../../database/database';
import { DRIZZLE } from '../../database/database.constants';
import { userWallets, walletTransactions, type UserWallet } from '../../database/schema';

export type RoomWalletDto = {
  roomSlug: RoomSlug;
  name: string;
  balanceCents: number;
  balance: string;
};

@Injectable()
export class WalletService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: AppConfigService,
  ) {}

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

  async getBalanceCents(userId: string, roomSlug: string): Promise<number> {
    const wallet = await this.getOrCreate(userId, roomSlug);
    return wallet.balanceCents;
  }

  async listForUser(userId: string) {
    const rows = await this.ensureAllRooms(userId);
    return {
      currency: 'USD' as const,
      wallets: rows.map((row) => this.toDto(row)),
    };
  }

  /** Dev / pre-Stripe top-up so money can live on VPower before partner transfer. */
  async devCredit(userId: string, roomSlug: string, amountCents: number) {
    if (this.config.isProduction) {
      throw new ServiceUnavailableException('Dev wallet credit disabled in production');
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    await this.credit(userId, roomSlug, amountCents, 'dev_credit', `dev-${Date.now()}`);
    return this.listForUser(userId);
  }

  async credit(userId: string, roomSlug: string, amountCents: number, kind: string, reference?: string) {
    const slug = this.parseRoomSlug(roomSlug);
    if (amountCents <= 0) throw new BadRequestException('credit amount must be positive');
    await this.getOrCreate(userId, slug);
    return this.db.transaction(async (tx) => {
      const [wallet] = await tx
        .update(userWallets)
        .set({
          balanceCents: sql`${userWallets.balanceCents} + ${amountCents}`,
          updatedAt: new Date(),
        })
        .where(and(eq(userWallets.userId, userId), eq(userWallets.roomSlug, slug)))
        .returning();
      await tx.insert(walletTransactions).values({
        userId,
        roomSlug: slug,
        amountCents,
        kind,
        reference,
      });
      return wallet!;
    });
  }

  async debit(userId: string, roomSlug: string, amountCents: number, kind: string, reference?: string) {
    const slug = this.parseRoomSlug(roomSlug);
    if (amountCents <= 0) throw new BadRequestException('debit amount must be positive');
    await this.getOrCreate(userId, slug);
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
            eq(userWallets.roomSlug, slug),
            sql`${userWallets.balanceCents} >= ${amountCents}`,
          ),
        )
        .returning();
      if (!wallet) {
        throw new BadRequestException(`Insufficient ${ROOM_NAMES[slug]} wallet balance`);
      }
      await tx.insert(walletTransactions).values({
        userId,
        roomSlug: slug,
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

  private toDto(row: UserWallet): RoomWalletDto {
    const slug = this.parseRoomSlug(row.roomSlug);
    return {
      roomSlug: slug,
      name: ROOM_NAMES[slug],
      balanceCents: row.balanceCents,
      balance: this.formatDollars(row.balanceCents),
    };
  }
}
