import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import type {
  GameProvider,
  LaunchSessionInput,
  LaunchSessionResult,
  RemoteGameSummary,
} from './game-provider.interface';

/**
 * Stub for the partner games API.
 * Real HTTP mapping lands here once client docs are available — no invented endpoints.
 */
@Injectable()
export class ClientGameProvider implements GameProvider {
  readonly mode = 'client' as const;

  constructor(private readonly config: AppConfigService) {}

  async listRemoteGames(): Promise<RemoteGameSummary[]> {
    this.assertConfigured();
    throw new ServiceUnavailableException(
      'Client game provider sync is not implemented yet — awaiting partner API docs',
    );
  }

  async launchSession(_input: LaunchSessionInput): Promise<LaunchSessionResult> {
    this.assertConfigured();
    throw new ServiceUnavailableException(
      'Client game provider launch is not implemented yet — awaiting partner API docs',
    );
  }

  private assertConfigured() {
    if (!this.config.gameApiBaseUrl) {
      throw new ServiceUnavailableException(
        'GAME_PROVIDER_MODE=client but GAME_API_BASE_URL is not configured',
      );
    }
  }
}
