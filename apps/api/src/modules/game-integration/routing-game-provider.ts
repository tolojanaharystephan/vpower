import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ClientGameProvider } from './client-game-provider';
import type {
  GameProvider,
  LaunchSessionInput,
  LaunchSessionResult,
  RemoteGameSummary,
} from './game-provider.interface';
import { VblinkClientService } from './vblink-client.service';

/**
 * Real platform routing: VBlink FastAPI only.
 * No mock launch path.
 */
@Injectable()
export class RoutingGameProvider implements GameProvider {
  readonly mode = 'client' as const;

  constructor(
    private readonly vblink: VblinkClientService,
    private readonly client: ClientGameProvider,
  ) {}

  private assertLive() {
    if (!this.vblink.isConfigured()) {
      throw new ServiceUnavailableException(
        'Game platform is not configured. Set VBLINK_ENABLED=true with App ID / App Secret / API base URL.',
      );
    }
  }

  listRemoteGames(): Promise<RemoteGameSummary[]> {
    this.assertLive();
    return this.client.listRemoteGames();
  }

  launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult> {
    this.assertLive();
    return this.client.launchSession(input);
  }
}
