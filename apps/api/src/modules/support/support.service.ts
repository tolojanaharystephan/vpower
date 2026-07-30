import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  supportMessages,
  supportTickets,
  users,
  type SupportMessage,
  type SupportTicket,
} from '../../database/schema';
import type { AuthUser } from '../auth/auth.types';
import type { PermissionCode } from '../rbac/permissions.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { TranslationService } from '../translation/translation.service';
import { SupportBotService } from './support-bot.service';
import { SupportGateway } from './support.gateway';
import { SupportMediaService } from './support-media.service';

type TicketStatus = SupportTicket['status'];
type TicketPriority = SupportTicket['priority'];

@Injectable()
export class SupportService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly translation: TranslationService,
    private readonly notifications: NotificationsService,
    private readonly media: SupportMediaService,
    private readonly bot: SupportBotService,
    @Optional() @Inject(forwardRef(() => SupportGateway)) private readonly gateway?: SupportGateway,
  ) {}

  private hasPermission(user: AuthUser, permission: PermissionCode) {
    return user.permissions.includes(permission);
  }

  private isStaffReader(user: AuthUser) {
    return this.hasPermission(user, 'support:read');
  }

  private isStaffWriter(user: AuthUser) {
    return this.hasPermission(user, 'support:write');
  }

  private assertCanView(ticket: SupportTicket, user: AuthUser) {
    if (ticket.userId === user.id || this.isStaffReader(user)) return;
    throw new ForbiddenException('Not allowed to view this ticket');
  }

  private assertCanReply(ticket: SupportTicket, user: AuthUser) {
    if (ticket.status === 'closed') {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }
    if (ticket.userId === user.id || this.isStaffWriter(user)) return;
    throw new ForbiddenException('Not allowed to reply to this ticket');
  }

  private toTicketPublic(
    ticket: SupportTicket,
    extras?: {
      userEmail?: string | null;
      userFirstName?: string | null;
      userLastName?: string | null;
      messageCount?: number;
    },
  ) {
    return {
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      preferredLang: ticket.preferredLang,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      ...(extras?.userEmail !== undefined
        ? {
            user: {
              id: ticket.userId,
              email: extras.userEmail,
              firstName: extras.userFirstName ?? null,
              lastName: extras.userLastName ?? null,
            },
          }
        : {}),
      ...(extras?.messageCount !== undefined ? { messageCount: extras.messageCount } : {}),
    };
  }

  private async toMessagePublic(message: SupportMessage, targetLang?: string | null) {
    const resolved = await this.translation.resolveMessage(message, targetLang);
    return {
      id: message.id,
      ticketId: message.ticketId,
      userId: message.userId,
      authorType: message.authorType,
      kind: message.kind,
      audioUrl: message.audioUrl,
      body: resolved.body,
      translatedBody: resolved.translatedBody,
      sourceLang: resolved.sourceLang,
      targetLang: resolved.targetLang,
      createdAt: message.createdAt,
    };
  }

  async create(
    userId: string,
    input: {
      subject: string;
      body: string;
      priority?: TicketPriority;
      preferredLang?: string;
    },
  ) {
    const now = new Date();
    const body = input.body.trim();
    const sourceLang = (await this.translation.detect(body)) ?? input.preferredLang ?? null;

    const [ticket] = await this.db
      .insert(supportTickets)
      .values({
        userId,
        subject: input.subject.trim(),
        priority: input.priority ?? 'normal',
        status: 'open',
        preferredLang: input.preferredLang?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!ticket) throw new BadRequestException('Failed to create ticket');

    const [message] = await this.db
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        userId,
        authorType: 'user',
        kind: 'text',
        body,
        sourceLang,
      })
      .returning();
    if (!message) throw new BadRequestException('Failed to create message');

    const publicTicket = this.toTicketPublic(ticket);
    const publicMessage = await this.toMessagePublic(message, input.preferredLang);

    const staffIds = await this.notifications.listSupportStaffUserIds();
    const notifs = await this.notifications.createMany(staffIds, {
      type: 'support_message',
      title: 'New support ticket',
      body: ticket.subject,
      data: { ticketId: ticket.id, type: 'support_message' },
    });

    this.gateway?.emitToStaff('ticket:created', { ticket: publicTicket, message: publicMessage });
    for (const n of notifs) {
      this.gateway?.emitToUser(n.userId, 'notification:new', this.notifications.toPublic(n));
    }

    return {
      ...publicTicket,
      messages: [publicMessage],
    };
  }

  async listMine(
    userId: string,
    input?: { status?: TicketStatus; page?: number; limit?: number },
  ) {
    const page = input?.page ?? 1;
    const limit = Math.min(input?.limit ?? 50, 100);
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [eq(supportTickets.userId, userId)];
    if (input?.status) conditions.push(eq(supportTickets.status, input.status));
    const where = and(...conditions);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(supportTickets)
        .where(where)
        .orderBy(desc(supportTickets.updatedAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(supportTickets).where(where),
    ]);

    return {
      data: rows.map((row) => this.toTicketPublic(row)),
      total: Number(countResult[0]?.total ?? 0),
    };
  }

  async listAll(input?: {
    search?: string;
    status?: TicketStatus;
    page?: number;
    limit?: number;
  }) {
    const page = input?.page ?? 1;
    const limit = Math.min(input?.limit ?? 50, 100);
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];
    if (input?.status) conditions.push(eq(supportTickets.status, input.status));
    if (input?.search?.trim()) {
      const q = `%${input.search.trim()}%`;
      conditions.push(or(ilike(supportTickets.subject, q), ilike(users.email, q))!);
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          ticket: supportTickets,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
        })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .where(where)
        .orderBy(desc(supportTickets.updatedAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .where(where),
    ]);

    return {
      data: rows.map((row) =>
        this.toTicketPublic(row.ticket, {
          userEmail: row.userEmail,
          userFirstName: row.userFirstName,
          userLastName: row.userLastName,
        }),
      ),
      total: Number(countResult[0]?.total ?? 0),
    };
  }

  async getOne(ticketId: string, user: AuthUser, targetLang?: string | null) {
    const [row] = await this.db
      .select({
        ticket: supportTickets,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!row) throw new NotFoundException('Ticket not found');
    this.assertCanView(row.ticket, user);

    const messages = await this.db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(supportMessages.createdAt);

    const resolved = await Promise.all(
      messages.map((m) => this.toMessagePublic(m, targetLang ?? row.ticket.preferredLang)),
    );

    return {
      ...this.toTicketPublic(row.ticket, {
        userEmail: row.userEmail,
        userFirstName: row.userFirstName,
        userLastName: row.userLastName,
      }),
      messages: resolved,
    };
  }

  async addMessage(
    ticketId: string,
    user: AuthUser,
    body: string,
    opts?: { sourceLangHint?: string; targetLang?: string },
  ) {
    const [ticket] = await this.db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertCanReply(ticket, user);

    const isStaff = ticket.userId !== user.id && this.isStaffWriter(user);
    const authorType = isStaff ? 'staff' : 'user';
    const now = new Date();
    const trimmed = body.trim();
    const sourceLang =
      (await this.translation.detect(trimmed)) ?? opts?.sourceLangHint?.trim() ?? null;

    const [message] = await this.db
      .insert(supportMessages)
      .values({
        ticketId,
        userId: user.id,
        authorType,
        kind: 'text',
        body: trimmed,
        sourceLang,
      })
      .returning();
    if (!message) throw new BadRequestException('Failed to create message');

    let nextStatus = ticket.status;
    if (isStaff && ticket.status === 'open') nextStatus = 'pending';
    if (!isStaff && ticket.status === 'pending') nextStatus = 'open';

    const [updated] = await this.db
      .update(supportTickets)
      .set({
        status: nextStatus,
        updatedAt: now,
        closedAt:
          nextStatus === 'closed' || nextStatus === 'resolved' ? (ticket.closedAt ?? now) : null,
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    if (!updated) throw new NotFoundException('Ticket not found');

    const publicTicket = this.toTicketPublic(updated);
    const publicMessage = await this.toMessagePublic(message, opts?.targetLang);

    if (isStaff) {
      const notif = await this.notifications.create({
        userId: ticket.userId,
        type: 'support_message',
        title: 'Support reply',
        body: updated.subject,
        data: { ticketId, type: 'support_message' },
      });
      if (notif) {
        this.gateway?.emitToUser(ticket.userId, 'notification:new', this.notifications.toPublic(notif));
      }
      this.gateway?.emitToUser(ticket.userId, 'message:new', {
        ticketId,
        message: publicMessage,
        ticket: publicTicket,
      });
    } else {
      const staffIds = await this.notifications.listSupportStaffUserIds();
      const notifs = await this.notifications.createMany(staffIds, {
        type: 'support_message',
        title: 'New support message',
        body: updated.subject,
        data: { ticketId, type: 'support_message' },
      });
      this.gateway?.emitToStaff('message:new', {
        ticketId,
        message: publicMessage,
        ticket: publicTicket,
      });
      for (const n of notifs) {
        this.gateway?.emitToUser(n.userId, 'notification:new', this.notifications.toPublic(n));
      }
    }

    this.gateway?.emitToTicket(ticketId, 'message:new', {
      ticketId,
      message: publicMessage,
      ticket: publicTicket,
    });

    return {
      ticket: publicTicket,
      message: publicMessage,
    };
  }

  async updateTicket(
    ticketId: string,
    input: { status?: TicketStatus; priority?: TicketPriority },
  ) {
    const [ticket] = await this.db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const nextStatus = input.status ?? ticket.status;
    const now = new Date();
    const closedStatuses: TicketStatus[] = ['resolved', 'closed'];
    const becomingClosed = closedStatuses.includes(nextStatus);
    const wasClosed = closedStatuses.includes(ticket.status);

    const [updated] = await this.db
      .update(supportTickets)
      .set({
        status: nextStatus,
        priority: input.priority ?? ticket.priority,
        updatedAt: now,
        closedAt: becomingClosed ? (wasClosed ? ticket.closedAt : now) : null,
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    if (!updated) throw new NotFoundException('Ticket not found');

    const publicTicket = this.toTicketPublic(updated);

    if (input.status && input.status !== ticket.status) {
      const notif = await this.notifications.create({
        userId: ticket.userId,
        type: 'support_status',
        title: 'Ticket status updated',
        body: `${updated.subject} → ${updated.status}`,
        data: { ticketId, type: 'support_status', status: updated.status },
      });
      if (notif) {
        this.gateway?.emitToUser(ticket.userId, 'notification:new', this.notifications.toPublic(notif));
      }
    }

    this.gateway?.emitToTicket(ticketId, 'ticket:updated', { ticket: publicTicket });
    this.gateway?.emitToStaff('ticket:updated', { ticket: publicTicket });
    this.gateway?.emitToUser(ticket.userId, 'ticket:updated', { ticket: publicTicket });

    return publicTicket;
  }

  async addVoiceMessage(
    ticketId: string,
    user: AuthUser,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    opts?: { caption?: string; targetLang?: string },
  ) {
    const [ticket] = await this.db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertCanReply(ticket, user);

    const allowed = /^(audio\/|video\/webm)/i.test(file.mimetype);
    if (!allowed) throw new BadRequestException('Only audio uploads are allowed');
    if (file.buffer.length > 8 * 1024 * 1024) {
      throw new BadRequestException('Voice message too large (max 8MB)');
    }

    const saved = await this.media.saveVoice(file);
    const isStaff = ticket.userId !== user.id && this.isStaffWriter(user);
    const authorType = isStaff ? 'staff' : 'user';
    const caption = opts?.caption?.trim() || '';
    const now = new Date();

    const [message] = await this.db
      .insert(supportMessages)
      .values({
        ticketId,
        userId: user.id,
        authorType,
        kind: 'voice',
        body: caption || '[Voice message]',
        audioUrl: saved.publicPath,
        sourceLang: null,
      })
      .returning();
    if (!message) throw new BadRequestException('Failed to create voice message');

    let nextStatus = ticket.status;
    if (isStaff && ticket.status === 'open') nextStatus = 'pending';
    if (!isStaff && ticket.status === 'pending') nextStatus = 'open';

    const [updated] = await this.db
      .update(supportTickets)
      .set({ status: nextStatus, updatedAt: now, closedAt: null })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    if (!updated) throw new NotFoundException('Ticket not found');

    const publicTicket = this.toTicketPublic(updated);
    const publicMessage = await this.toMessagePublic(message, opts?.targetLang);

    this.gateway?.emitToTicket(ticketId, 'message:new', {
      ticketId,
      message: publicMessage,
      ticket: publicTicket,
    });
    if (isStaff) {
      this.gateway?.emitToUser(ticket.userId, 'message:new', {
        ticketId,
        message: publicMessage,
        ticket: publicTicket,
      });
    } else {
      this.gateway?.emitToStaff('message:new', {
        ticketId,
        message: publicMessage,
        ticket: publicTicket,
      });
    }

    return { ticket: publicTicket, message: publicMessage };
  }

  askBot(input: { message: string; locale?: string }) {
    return this.bot.reply(input);
  }

  async escalateFromBot(
    userId: string,
    input: {
      message: string;
      preferredLang?: string;
      subject?: string;
      botAnswer?: string;
    },
  ) {
    const subject =
      input.subject?.trim() ||
      (input.message.trim().slice(0, 80) || 'Support request from assistant');
    const bodyParts = [
      input.message.trim(),
      input.botAnswer
        ? `\n\n---\nAssistant suggested:\n${input.botAnswer.trim()}`
        : '',
    ];
    const created = await this.create(userId, {
      subject,
      body: bodyParts.join(''),
      preferredLang: input.preferredLang,
    });

    if (input.botAnswer?.trim()) {
      await this.db.insert(supportMessages).values({
        ticketId: created.id,
        userId,
        authorType: 'bot',
        kind: 'text',
        body: input.botAnswer.trim(),
        sourceLang: input.preferredLang ?? null,
      });
    }

    const messages = await this.db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, created.id))
      .orderBy(supportMessages.createdAt);

    return {
      ...created,
      messages: await Promise.all(
        messages.map((m) => this.toMessagePublic(m, input.preferredLang)),
      ),
    };
  }

  async translateMessage(
    ticketId: string,
    messageId: string,
    user: AuthUser,
    targetLang: string,
  ) {
    const [ticket] = await this.db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertCanView(ticket, user);

    const [message] = await this.db
      .select()
      .from(supportMessages)
      .where(and(eq(supportMessages.id, messageId), eq(supportMessages.ticketId, ticketId)))
      .limit(1);
    if (!message) throw new NotFoundException('Message not found');

    return this.toMessagePublic(message, targetLang);
  }
}
