import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  GAME_PROVIDER,
  type GameProvider,
  type LaunchSessionInput,
  type LaunchSessionResult,
  type RemoteGameSummary,
} from './game-provider.interface';
import { Provider100PlusService } from '../provider-100plus/provider-100plus.service';
import { ClientGameProvider } from './client-game-provider';
import { VblinkClientService } from './vblink-client.service';

@Injectable()
export class GameIntegrationService {
  constructor(
    @Inject(GAME_PROVIDER) private readonly provider: GameProvider,
    private readonly client: ClientGameProvider,
    private readonly vblink: VblinkClientService,
    private readonly plus100: Provider100PlusService,
  ) {}

  get mode() {
    return this.provider.mode;
  }

  listRemoteGames(): Promise<RemoteGameSummary[]> {
    return this.provider.listRemoteGames();
  }

  launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    return this.provider.launchSession(input);
  }

  enterVblink(userId: string): Promise<LaunchSessionResult> {
    if (!this.vblink.isConfigured()) {
      throw new ServiceUnavailableException(
        'VBlink is not configured. Set VBLINK_ENABLED and credentials.',
      );
    }
    return this.client.launchSession({ gameId: 'vblink-lobby', userId });
  }

  enterPlus100(userId: string, locale?: string): Promise<LaunchSessionResult> {
    if (!this.plus100.isConfigured()) {
      throw new ServiceUnavailableException(
        '100Plus is not configured. Set PLUS100_API_URL, PLUS100_AGENT_ID, PLUS100_SECRET_KEY.',
      );
    }
    return this.plus100.launchLobby(userId, locale);
  }
}
