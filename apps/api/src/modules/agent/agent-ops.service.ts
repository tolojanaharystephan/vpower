import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ROOM_NAMES, ROOM_SLUGS, isRoomSlug, type RoomSlug } from '@vpower777/types';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  agentRoomScopes,
  roomChatMessages,
  roomConversations,
  userWallets,
  users,
  walletTransactions,
} from '../../database/schema';
import type { AuthUser } from '../auth/auth.types';
import { PERMISSIONS } from '../rbac/permissions.constants';
import { WalletService } from '../wallet/wallet.service';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AgentOpsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly wallets: WalletService,
  ) {}

  isGlobalStaff(user: AuthUser): boolean {
    return (
      user.permissions.includes(PERMISSIONS.ADMIN_ACCESS) ||
      user.roles.includes('SUPER_ADMIN') ||
      user.roles.includes('ADMIN')
    );
  }

  async getScopedRooms(user: AuthUser): Promise<RoomSlug[]> {
    if (this.isGlobalStaff(user)) return [...ROOM_SLUGS];
    const rows = await this.db
      .select({ roomSlug: agentRoomScopes.roomSlug })
      .from(agentRoomScopes)
      .where(eq(agentRoomScopes.userId, user.id));
    return rows
      .map((r) => r.roomSlug)
      .filter((s): s is RoomSlug => isRoomSlug(s));
  }

  async assertRoomAccess(user: AuthUser, roomSlug: string): Promise<RoomSlug> {
    const slug = this.wallets.parseRoomSlug(roomSlug);
    if (this.isGlobalStaff(user)) return slug;
    const rooms = await this.getScopedRooms(user);
    if (!rooms.includes(slug)) {
      throw new ForbiddenException(`No access to room ${slug}`);
    }
    return slug;
  }

  async listMyRooms(user: AuthUser) {
    const rooms = await this.getScopedRooms(user);
    return rooms.map((roomSlug) => ({
      roomSlug,
      name: ROOM_NAMES[roomSlug],
    }));
  }

  async roomStats(user: AuthUser, roomSlug: string, from?: Date, to?: Date) {
    const slug = await this.assertRoomAccess(user, roomSlug);
    const conditions = [
      eq(walletTransactions.roomSlug, slug),
      inArray(walletTransactions.kind, ['agent_deposit', 'agent_withdraw']),
    ];
    if (from) conditions.push(gte(walletTransactions.createdAt, from));
    if (to) conditions.push(lte(walletTransactions.createdAt, to));

    const rows = await this.db
      .select({
        kind: walletTransactions.kind,
        total: sql<number>`coalesce(sum(${walletTransactions.amountCents}), 0)`,
      })
      .from(walletTransactions)
      .where(and(...conditions))
      .groupBy(walletTransactions.kind);

    let deposits = 0;
    let withdrawals = 0;
    for (const row of rows) {
      const total = Number(row.total);
      if (row.kind === 'agent_deposit') deposits += total;
      if (row.kind === 'agent_withdraw') withdrawals += Math.abs(total);
    }

    const [balanceRow] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${userWallets.balanceCents}), 0)`,
      })
      .from(userWallets)
      .where(eq(userWallets.roomSlug, slug));

    return {
      roomSlug: slug,
      name: ROOM_NAMES[slug],
      depositsCents: deposits,
      withdrawalsCents: withdrawals,
      netCents: deposits - withdrawals,
      walletsBalanceCents: Number(balanceRow?.total ?? 0),
      deposits: this.wallets.formatDollars(deposits),
      withdrawals: this.wallets.formatDollars(withdrawals),
      net: this.wallets.formatDollars(deposits - withdrawals),
      walletsBalance: this.wallets.formatDollars(Number(balanceRow?.total ?? 0)),
    };
  }

  async platformRevenue(user: AuthUser, from?: Date, to?: Date) {
    if (!this.isGlobalStaff(user) && !user.permissions.includes(PERMISSIONS.REVENUE_READ)) {
      throw new ForbiddenException('Revenue access required');
    }
    const rooms = [];
    for (const slug of ROOM_SLUGS) {
      rooms.push(await this.roomStats(user, slug, from, to));
    }
    const depositsCents = rooms.reduce((s, r) => s + r.depositsCents, 0);
    const withdrawalsCents = rooms.reduce((s, r) => s + r.withdrawalsCents, 0);
    return {
      rooms,
      totals: {
        depositsCents,
        withdrawalsCents,
        netCents: depositsCents - withdrawalsCents,
        deposits: this.wallets.formatDollars(depositsCents),
        withdrawals: this.wallets.formatDollars(withdrawalsCents),
        net: this.wallets.formatDollars(depositsCents - withdrawalsCents),
      },
    };
  }

  async listRoomPlayers(user: AuthUser, roomSlug: string) {
    const slug = await this.assertRoomAccess(user, roomSlug);
    const walletRows = await this.db
      .select({
        userId: userWallets.userId,
        balanceCents: userWallets.balanceCents,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(userWallets)
      .innerJoin(users, eq(users.id, userWallets.userId))
      .where(and(eq(userWallets.roomSlug, slug), sql`${users.deletedAt} is null`))
      .orderBy(desc(userWallets.updatedAt));

    return walletRows.map((r) => ({
      id: r.userId,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      displayName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email,
      balanceCents: r.balanceCents,
      balance: this.wallets.formatDollars(r.balanceCents),
      roomSlug: slug,
    }));
  }

  async getPlayerDetail(user: AuthUser, roomSlug: string, playerId: string) {
    const slug = await this.assertRoomAccess(user, roomSlug);
    const [player] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, playerId), sql`${users.deletedAt} is null`))
      .limit(1);
    if (!player) throw new NotFoundException('Player not found');

    const wallet = await this.wallets.getOrCreate(playerId, slug);
    const transactions = await this.wallets.listTransactions(playerId, slug, 100);
    const conversation = await this.getOrCreateConversation(playerId, slug);

    return {
      player: {
        id: player.id,
        email: player.email,
        firstName: player.firstName,
        lastName: player.lastName,
        displayName:
          [player.firstName, player.lastName].filter(Boolean).join(' ') || player.email,
        createdAt: player.createdAt,
      },
      wallet: {
        roomSlug: slug,
        name: ROOM_NAMES[slug],
        balanceCents: wallet.balanceCents,
        balance: this.wallets.formatDollars(wallet.balanceCents),
      },
      transactions: transactions.map((tx) => ({
        id: tx.id,
        kind: tx.kind,
        amountCents: tx.amountCents,
        amount: this.wallets.formatDollars(Math.abs(tx.amountCents)),
        reference: tx.reference,
        createdByUserId: tx.createdByUserId,
        createdAt: tx.createdAt,
      })),
      conversationId: conversation.id,
    };
  }

  async creditPlayer(
    user: AuthUser,
    roomSlug: string,
    playerId: string,
    amountCents: number,
    note?: string,
  ) {
    const slug = await this.assertRoomAccess(user, roomSlug);
    const wallet = await this.wallets.credit(
      playerId,
      slug,
      amountCents,
      'agent_deposit',
      note || `agent-deposit-${Date.now()}`,
      user.id,
    );
    return {
      balanceCents: wallet.balanceCents,
      balance: this.wallets.formatDollars(wallet.balanceCents),
    };
  }

  async debitPlayer(
    user: AuthUser,
    roomSlug: string,
    playerId: string,
    amountCents: number,
    note?: string,
  ) {
    const slug = await this.assertRoomAccess(user, roomSlug);
    const wallet = await this.wallets.debit(
      playerId,
      slug,
      amountCents,
      'agent_withdraw',
      note || `agent-withdraw-${Date.now()}`,
      user.id,
    );
    return {
      balanceCents: wallet.balanceCents,
      balance: this.wallets.formatDollars(wallet.balanceCents),
    };
  }

  async getOrCreateConversation(playerUserId: string, roomSlug: RoomSlug) {
    const [existing] = await this.db
      .select()
      .from(roomConversations)
      .where(
        and(
          eq(roomConversations.playerUserId, playerUserId),
          eq(roomConversations.roomSlug, roomSlug),
        ),
      )
      .limit(1);
    if (existing) return existing;
    const [created] = await this.db
      .insert(roomConversations)
      .values({ playerUserId, roomSlug })
      .onConflictDoNothing()
      .returning();
    if (created) return created;
    const [again] = await this.db
      .select()
      .from(roomConversations)
      .where(
        and(
          eq(roomConversations.playerUserId, playerUserId),
          eq(roomConversations.roomSlug, roomSlug),
        ),
      )
      .limit(1);
    if (!again) throw new NotFoundException('Conversation unavailable');
    return again;
  }

  async listConversations(user: AuthUser, roomSlug?: string) {
    const rooms = roomSlug
      ? [await this.assertRoomAccess(user, roomSlug)]
      : await this.getScopedRooms(user);

    const rows = await this.db
      .select({
        id: roomConversations.id,
        roomSlug: roomConversations.roomSlug,
        lastMessageAt: roomConversations.lastMessageAt,
        playerUserId: roomConversations.playerUserId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(roomConversations)
      .innerJoin(users, eq(users.id, roomConversations.playerUserId))
      .where(inArray(roomConversations.roomSlug, rooms))
      .orderBy(desc(roomConversations.lastMessageAt));

    return rows.map((r) => ({
      id: r.id,
      roomSlug: r.roomSlug,
      roomName: isRoomSlug(r.roomSlug) ? ROOM_NAMES[r.roomSlug] : r.roomSlug,
      lastMessageAt: r.lastMessageAt,
      player: {
        id: r.playerUserId,
        email: r.email,
        displayName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email,
      },
    }));
  }

  async listMessages(user: AuthUser, conversationId: string) {
    const [conv] = await this.db
      .select()
      .from(roomConversations)
      .where(eq(roomConversations.id, conversationId))
      .limit(1);
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.assertRoomAccess(user, conv.roomSlug);

    const messages = await this.db
      .select({
        id: roomChatMessages.id,
        body: roomChatMessages.body,
        imageUrl: roomChatMessages.imageUrl,
        authorKind: roomChatMessages.authorKind,
        authorUserId: roomChatMessages.authorUserId,
        createdAt: roomChatMessages.createdAt,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(roomChatMessages)
      .innerJoin(users, eq(users.id, roomChatMessages.authorUserId))
      .where(eq(roomChatMessages.conversationId, conversationId))
      .orderBy(roomChatMessages.createdAt);

    return {
      conversation: {
        id: conv.id,
        roomSlug: conv.roomSlug,
        playerUserId: conv.playerUserId,
      },
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        imageUrl: m.imageUrl,
        authorKind: m.authorKind,
        authorUserId: m.authorUserId,
        authorName: [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email,
        createdAt: m.createdAt,
      })),
    };
  }

  async postAgentMessage(
    user: AuthUser,
    conversationId: string,
    body: string,
    imageUrl?: string,
  ) {
    const [conv] = await this.db
      .select()
      .from(roomConversations)
      .where(eq(roomConversations.id, conversationId))
      .limit(1);
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.assertRoomAccess(user, conv.roomSlug);

    const [msg] = await this.db
      .insert(roomChatMessages)
      .values({
        conversationId,
        authorUserId: user.id,
        authorKind: 'agent',
        body: body || '',
        imageUrl: imageUrl || null,
      })
      .returning();

    await this.db
      .update(roomConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(roomConversations.id, conversationId));

    return msg!;
  }

  async playerGetOrCreateConversation(playerUserId: string, roomSlug: string) {
    const slug = this.wallets.parseRoomSlug(roomSlug);
    return this.getOrCreateConversation(playerUserId, slug);
  }

  async playerListMessages(playerUserId: string, roomSlug: string) {
    const slug = this.wallets.parseRoomSlug(roomSlug);
    const conv = await this.getOrCreateConversation(playerUserId, slug);
    const messages = await this.db
      .select({
        id: roomChatMessages.id,
        body: roomChatMessages.body,
        imageUrl: roomChatMessages.imageUrl,
        authorKind: roomChatMessages.authorKind,
        authorUserId: roomChatMessages.authorUserId,
        createdAt: roomChatMessages.createdAt,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(roomChatMessages)
      .innerJoin(users, eq(users.id, roomChatMessages.authorUserId))
      .where(eq(roomChatMessages.conversationId, conv.id))
      .orderBy(roomChatMessages.createdAt);

    return {
      conversation: { id: conv.id, roomSlug: slug, playerUserId },
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        imageUrl: m.imageUrl,
        authorKind: m.authorKind,
        authorUserId: m.authorUserId,
        authorName: [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email,
        createdAt: m.createdAt,
      })),
    };
  }

  async playerPostMessage(
    playerUserId: string,
    roomSlug: string,
    body: string,
    imageUrl?: string,
  ) {
    const slug = this.wallets.parseRoomSlug(roomSlug);
    const conv = await this.getOrCreateConversation(playerUserId, slug);
    const [msg] = await this.db
      .insert(roomChatMessages)
      .values({
        conversationId: conv.id,
        authorUserId: playerUserId,
        authorKind: 'player',
        body: body || '',
        imageUrl: imageUrl || null,
      })
      .returning();
    await this.db
      .update(roomConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(roomConversations.id, conv.id));
    return msg!;
  }

  async saveChatImage(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<string> {
    const root = join(process.cwd(), 'uploads', 'chat');
    await mkdir(root, { recursive: true });
    const ext = this.imageExt(file.mimetype, file.originalname);
    const name = `${randomUUID()}${ext}`;
    await writeFile(join(root, name), file.buffer);
    return `/uploads/chat/${name}`;
  }

  async assignAgent(agentUserId: string, roomSlugs: string[]) {
    const slugs = roomSlugs.map((s) => this.wallets.parseRoomSlug(s));
    await this.db.delete(agentRoomScopes).where(eq(agentRoomScopes.userId, agentUserId));
    if (slugs.length) {
      await this.db.insert(agentRoomScopes).values(
        slugs.map((roomSlug) => ({ userId: agentUserId, roomSlug })),
      );
    }
    return { userId: agentUserId, rooms: slugs };
  }

  async listAgentAssignments() {
    const rows = await this.db
      .select({
        userId: agentRoomScopes.userId,
        roomSlug: agentRoomScopes.roomSlug,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(agentRoomScopes)
      .innerJoin(users, eq(users.id, agentRoomScopes.userId));

    const byUser = new Map<
      string,
      { userId: string; email: string; displayName: string; rooms: string[] }
    >();
    for (const r of rows) {
      const cur = byUser.get(r.userId) || {
        userId: r.userId,
        email: r.email,
        displayName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email,
        rooms: [] as string[],
      };
      cur.rooms.push(r.roomSlug);
      byUser.set(r.userId, cur);
    }
    return [...byUser.values()];
  }

  async listRoomTransactions(user: AuthUser, roomSlug: string, limit = 100) {
    const slug = await this.assertRoomAccess(user, roomSlug);
    const rows = await this.db
      .select({
        id: walletTransactions.id,
        userId: walletTransactions.userId,
        amountCents: walletTransactions.amountCents,
        kind: walletTransactions.kind,
        reference: walletTransactions.reference,
        createdByUserId: walletTransactions.createdByUserId,
        createdAt: walletTransactions.createdAt,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(walletTransactions)
      .innerJoin(users, eq(users.id, walletTransactions.userId))
      .where(
        and(
          eq(walletTransactions.roomSlug, slug),
          inArray(walletTransactions.kind, ['agent_deposit', 'agent_withdraw']),
        ),
      )
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      playerName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email,
      email: r.email,
      kind: r.kind,
      amountCents: r.amountCents,
      amount: this.wallets.formatDollars(Math.abs(r.amountCents)),
      reference: r.reference,
      createdByUserId: r.createdByUserId,
      createdAt: r.createdAt,
    }));
  }

  private imageExt(mimetype: string, original: string): string {
    const fromName = extname(original).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) return fromName;
    if (mimetype.includes('png')) return '.png';
    if (mimetype.includes('webp')) return '.webp';
    if (mimetype.includes('gif')) return '.gif';
    return '.jpg';
  }
}
