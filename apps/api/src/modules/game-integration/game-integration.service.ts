import { Inject, Injectable } from '@nestjs/common';
import {
  GAME_PROVIDER,
  type GameProvider,
  type LaunchSessionInput,
  type LaunchSessionResult,
  type RemoteGameSummary,
} from './game-provider.interface';

@Injectable()
export class GameIntegrationService {
  constructor(@Inject(GAME_PROVIDER) private readonly provider: GameProvider) {}

  get mode() {
    return this.provider.mode;
  }

  listRemoteGames(): Promise<RemoteGameSummary[]> {
    return this.provider.listRemoteGames();
  }

  launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    return this.provider.launchSession(input);
  }
}
