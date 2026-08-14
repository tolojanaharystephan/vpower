import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  GAME_PROVIDER,
  type GameProvider,
  type LaunchSessionInput,
  type LaunchSessionResult,
  type RemoteGameSummary,
} from './game-provider.interface';
import { ClientGameProvider } from './client-game-provider';
import { VblinkClientService } from './vblink-client.service';

@Injectable()
export class GameIntegrationService {
  constructor(
    @Inject(GAME_PROVIDER) private readonly provider: GameProvider,
    private readonly client: ClientGameProvider,
    private readonly vblink: VblinkClientService,
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
}
