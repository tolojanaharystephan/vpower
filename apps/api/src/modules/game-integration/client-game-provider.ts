import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GamesService } from '../games/games.service';
import { UsersService } from '../users/users.service';
import { VblinkClientService } from './vblink-client.service';
import type {
  GameProvider,
  LaunchSessionInput,
  LaunchSessionResult,
  RemoteGameSummary,
} from './game-provider.interface';

const VBLINK_PUBLIC_LOBBY_URL = 'https://www.vblink777.club';

/**
 * Click → ensure VBlink player → return public Game Mainpage.
 * No SSO / game launch URL (not in FastAPI PDF).
 */
@Injectable()
export class ClientGameProvider implements GameProvider {
  readonly mode = 'client' as const;

  constructor(
    private readonly games: GamesService,
    private readonly users: UsersService,
    private readonly vblink: VblinkClientService,
  ) {}

  async listRemoteGames(): Promise<RemoteGameSummary[]> {
    this.assertConfigured();
    return [];
  }

  async launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    this.assertConfigured();

    const lobbyOnly = input.gameId === 'vblink-lobby';
    let gameId = input.gameId;
    let slug = 'vblink';
    let title = 'VBlink';

    if (!lobbyOnly) {
      const game = await this.games.findGameById(input.gameId);
      if (!game || game.deletedAt || game.status !== 'active') {
        throw new NotFoundException('Game not found or not available');
      }
      gameId = game.id;
      slug = game.slug;
      title = game.title;
    }

    const { account, password } = await this.users.ensureVblinkAccount(input.userId);

    return {
      mode: 'client',
      gameId,
      slug,
      title,
      sessionId: randomUUID(),
      launchUrl: VBLINK_PUBLIC_LOBBY_URL,
      message:
        'VBlink player account is ready. Open the lobby, sign in with your VBlink credentials, and play.',
      vblinkAccount: account,
      vblinkPassword: password,
      requiresManualLogin: true,
    };
  }

  private assertConfigured() {
    if (!this.vblink.isConfigured()) {
      throw new ServiceUnavailableException(
        'VBlink is not configured. Set VBLINK_ENABLED=true, VBLINK_APP_ID, VBLINK_APP_SECRET.',
      );
    }
  }
}
