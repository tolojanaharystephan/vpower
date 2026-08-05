import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppConfigService } from '../../config/app-config.service';
import { GamesService } from '../games/games.service';
import type {
  GameProvider,
  LaunchSessionInput,
  LaunchSessionResult,
  RemoteGameSummary,
} from './game-provider.interface';

@Injectable()
export class MockGameProvider implements GameProvider {
  readonly mode = 'mock' as const;

  constructor(
    private readonly games: GamesService,
    private readonly config: AppConfigService,
  ) {}

  async listRemoteGames(): Promise<RemoteGameSummary[]> {
    const { data } = await this.games.findCatalogGames({ limit: 100 });
    return data.map((g) => ({
      externalId: g.id,
      slug: g.slug,
      title: g.title,
    }));
  }

  async launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    const game = await this.games.findGameById(input.gameId);
    if (!game || game.deletedAt || game.status !== 'active') {
      throw new NotFoundException('Game not found or not available');
    }

    const locale = input.locale === 'en' ? 'en' : 'fr';
    const base = this.config.appUrl.replace(/\/$/, '');
    const launchUrl = `${base}/${locale}/play/${game.slug}`;

    return {
      mode: 'mock',
      gameId: game.id,
      slug: game.slug,
      title: game.title,
      sessionId: randomUUID(),
      launchUrl,
      message:
        'Mock session — external game provider not connected yet. Demo play screen only.',
    };
  }
}
