import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AppConfigService } from '../../config/app-config.service';
import { AuthService } from '../auth/auth.service';
import type { AuthUser } from '../auth/auth.types';

type SocketData = {
  user: AuthUser;
  targetLang?: string;
};

@WebSocketGateway({
  namespace: '/support',
  cors: { origin: true, credentials: true },
})
export class SupportGateway implements OnGatewayConnection {
  private readonly logger = new Logger(SupportGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '') ?? undefined);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(token, {
        secret: this.config.jwtSecret,
      });
      const user = await this.auth.validateAccessPayload(payload);
      (client.data as SocketData).user = user;
      await client.join(`user:${user.id}`);
      if (user.permissions.includes('support:read')) {
        await client.join('staff:support');
      }
    } catch (err) {
      this.logger.debug(`WS auth failed: ${err instanceof Error ? err.message : String(err)}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('prefs:set')
  handlePrefs(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { targetLang?: string; ticketId?: string },
  ) {
    const data = client.data as SocketData;
    if (body.targetLang?.trim()) {
      data.targetLang = body.targetLang.trim();
    }
    if (body.ticketId) {
      void client.join(`ticket:${body.ticketId}`);
    }
    return { ok: true };
  }

  @SubscribeMessage('ticket:join')
  handleJoinTicket(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId: string }) {
    if (body.ticketId) void client.join(`ticket:${body.ticketId}`);
    return { ok: true };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToStaff(event: string, payload: unknown) {
    this.server.to('staff:support').emit(event, payload);
  }

  emitToTicket(ticketId: string, event: string, payload: unknown) {
    this.server.to(`ticket:${ticketId}`).emit(event, payload);
  }

  getTargetLang(client: Socket): string | undefined {
    return (client.data as SocketData).targetLang;
  }
}
