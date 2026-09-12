import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { AppConfigService } from '../../config/app-config.service';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { providerPlayerAccounts, users } from '../../database/schema';
import type { LaunchSessionResult } from '../game-integration/game-provider.interface';
import { WalletService } from '../wallet/wallet.service';
import { DgamesApiClient } from './dgames-api.client';
import { DGAMES_PROVIDER_SLUG, DGAMES_ROOM_SLUG } from './dgames-callback.service';

@Injectable()
export class ProviderDgamesService {
  private readonly logger = new Logger(ProviderDgamesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly api: DgamesApiClient,
    private readonly wallets: WalletService,
    private readonly config: AppConfigService,
  ) {}

  isConfigured(): boolean {
    return this.api.isConfigured();
  }

  /** Stable GamesAPI login: vp + 12 hex chars from user id. */
  loginForUser(userId: string): string {
    return `vp${userId.replace(/-/g, '').slice(0, 12)}`;
  }

  async ensurePlayer(userId: string): Promise<{ login: string }> {
    const login = this.loginForUser(userId);
    const [existing] = await this.db
      .select()
      .from(providerPlayerAccounts)
      .where(
        and(
          eq(providerPlayerAccounts.userId, userId),
          eq(providerPlayerAccounts.providerSlug, DGAMES_PROVIDER_SLUG),
        ),
      )
      .limit(1);

    if (existing) {
      await this.wallets.getOrCreate(userId, DGAMES_ROOM_SLUG);
      return { login: existing.externalAccount };
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw new NotFoundException('User not found');

    await this.db.insert(providerPlayerAccounts).values({
      userId,
      providerSlug: DGAMES_PROVIDER_SLUG,
      externalAccount: login,
      fullAccount: login,
      externalPassword: 'n/a',
    });
    await this.wallets.getOrCreate(userId, DGAMES_ROOM_SLUG);
    this.logger.log(`DGames player mapped ${userId} → ${login}`);
    return { login };
  }

  async listGames() {
    this.api.assertConfigured();
    return this.api.getGamesList();
  }

  async launchGame(
    userId: string,
    gameId: string,
    locale?: string,
  ): Promise<LaunchSessionResult & {
    withoutFrame?: boolean;
    exitButton?: boolean;
    dgamesLogin?: string;
  }> {
    this.api.assertConfigured();
    const { login } = await this.ensurePlayer(userId);
    const language = (locale || 'en').split('-')[0] || 'en';
    const opened = await this.api.openGame({
      login,
      gameId,
      language,
      demo: '0',
    });

    return {
      mode: 'client',
      gameId: String(gameId),
      slug: DGAMES_PROVIDER_SLUG,
      title: `DGames ${gameId}`,
      sessionId: opened.sessionId || `dgames-${Date.now()}`,
      launchUrl: opened.url,
      message: 'DGames session ready',
      requiresManualLogin: false,
      dgamesLogin: login,
      withoutFrame: opened.withoutFrame === '1',
      exitButton: opened.exitButton === '1' || opened.exitButtonMobile === '1',
    };
  }

  /**
   * Enter room: return first available game launch, or a soft lobby payload when list is empty.
   */
  async enterLobby(userId: string, locale?: string) {
    this.api.assertConfigured();
    const { login } = await this.ensurePlayer(userId);
    const games = await this.api.getGamesList();
    if (games.length === 0) {
      return {
        mode: 'client' as const,
        gameId: 'dgames-lobby',
        slug: DGAMES_PROVIDER_SLUG,
        title: 'DGames',
        sessionId: `dgames-lobby-${Date.now()}`,
        launchUrl: '',
        message: 'No games returned yet — open a title from the DGames lobby list.',
        requiresManualLogin: false,
        dgamesLogin: login,
        games,
      };
    }
    const first = games[0]!;
    const launched = await this.launchGame(userId, first.id, locale);
    return { ...launched, title: first.name, games };
  }
}
