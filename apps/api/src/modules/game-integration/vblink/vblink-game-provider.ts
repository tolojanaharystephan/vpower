import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AppConfigService } from '../../../config/app-config.service';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database';
import { providerPlayerAccounts } from '../../../database/schema';
import { GamesService } from '../../games/games.service';
import type {
  GameProvider,
  LaunchSessionInput,
  LaunchSessionResult,
  RemoteGameSummary,
} from '../game-provider.interface';
import { VblinkApiClient } from './vblink-api-client';
import { vblinkAccountForUser, vblinkPasswordForUser } from './vblink-sign';

@Injectable()
export class VblinkGameProvider implements GameProvider {
  readonly mode = 'vblink' as const;

  constructor(
    private readonly config: AppConfigService,
    private readonly api: VblinkApiClient,
    private readonly games: GamesService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  isConfigured(): boolean {
    return this.api.isConfigured();
  }

  async listRemoteGames(): Promise<RemoteGameSummary[]> {
    // FastAPI PDF has no game-list endpoint — catalog stays in our DB.
    return [];
  }

  async launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    this.api.assertConfigured();
    const game = await this.games.findGameById(input.gameId);
    if (!game || game.deletedAt || game.status !== 'active') {
      throw new NotFoundException('Game not found or not available');
    }
    if (game.provider.slug !== 'vblink') {
      throw new NotFoundException('Not a VBlink game');
    }

    const link = await this.ensurePlayer(input.userId);
    const lobbyUrl = this.config.vblink.lobbyUrl;
    const locale = input.locale === 'en' ? 'en' : 'fr';
    const bridgePath = `/${locale}/play/vblink`;

    return {
      mode: 'vblink',
      gameId: game.id,
      slug: game.slug,
      title: game.title,
      sessionId: randomUUID(),
      launchUrl: `${this.config.appUrl.replace(/\/$/, '')}${bridgePath}`,
      message:
        'VBlink account ready. Open the lobby with the provisioned credentials (FastAPI has no SSO launch URL in the PDF).',
      externalLogin: {
        account: link.fullAccount || link.externalAccount,
        password: link.externalPassword,
        lobbyUrl,
      },
    };
  }

  private async ensurePlayer(userId: string) {
    const existing = await this.db
      .select()
      .from(providerPlayerAccounts)
      .where(
        and(
          eq(providerPlayerAccounts.userId, userId),
          eq(providerPlayerAccounts.providerSlug, 'vblink'),
        ),
      )
      .limit(1);

    if (existing[0]) return existing[0];

    const account = vblinkAccountForUser(userId);
    const password = vblinkPasswordForUser(userId, this.config.vblink.appSecret);
    const created = await this.api.createPlayer(account, password);

    const [row] = await this.db
      .insert(providerPlayerAccounts)
      .values({
        userId,
        providerSlug: 'vblink',
        externalAccount: account,
        fullAccount: created.fullAccount ?? null,
        externalPassword: password,
      })
      .onConflictDoNothing({
        target: [providerPlayerAccounts.userId, providerPlayerAccounts.providerSlug],
      })
      .returning();

    if (row) return row;

    const [again] = await this.db
      .select()
      .from(providerPlayerAccounts)
      .where(
        and(
          eq(providerPlayerAccounts.userId, userId),
          eq(providerPlayerAccounts.providerSlug, 'vblink'),
        ),
      )
      .limit(1);
    if (!again) {
      throw new NotFoundException('Failed to provision VBlink player');
    }
    return again;
  }
}
