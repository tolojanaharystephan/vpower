import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { GamesService } from '../games/games.service';
import { ClientGameProvider } from './client-game-provider';
import type {
  GameProvider,
  LaunchSessionInput,
  LaunchSessionResult,
  RemoteGameSummary,
} from './game-provider.interface';
import { MockGameProvider } from './mock-game-provider';
import { VblinkGameProvider } from './vblink/vblink-game-provider';

/**
 * Routes launch by catalog provider slug.
 * VBlink uses FastAPI PDF integration; others stay on mock/client until wired.
 */
@Injectable()
export class RoutingGameProvider implements GameProvider {
  readonly mode = 'client' as const;

  constructor(
    private readonly config: AppConfigService,
    private readonly games: GamesService,
    private readonly vblink: VblinkGameProvider,
    private readonly mock: MockGameProvider,
    private readonly client: ClientGameProvider,
  ) {}

  private get fallback(): GameProvider {
    return this.config.gameProviderMode === 'client' ? this.client : this.mock;
  }

  listRemoteGames(): Promise<RemoteGameSummary[]> {
    return this.fallback.listRemoteGames();
  }

  async launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    const game = await this.games.findGameById(input.gameId);
    if (game?.provider.slug === 'vblink' && this.vblink.isConfigured()) {
      return this.vblink.launchSession(input);
    }
    return this.fallback.launchSession(input);
  }
}
