export const GAME_PROVIDER = Symbol('GAME_PROVIDER');

export type LaunchSessionInput = {
  gameId: string;
  userId: string;
  locale?: string;
};

export type LaunchSessionResult = {
  mode: 'mock' | 'client' | 'vblink';
  gameId: string;
  slug: string;
  title: string;
  sessionId: string;
  launchUrl: string;
  message: string;
  /** Present for providers without SSO launch (VBlink FastAPI PDF). */
  externalLogin?: {
    account: string;
    password: string;
    lobbyUrl: string;
  };
};

export type RemoteGameSummary = {
  externalId: string;
  slug: string;
  title: string;
};

/**
 * Internal contract for external game studios.
 * Per-provider adapters (VBlink, …) are selected by RoutingGameProvider.
 */
export interface GameProvider {
  readonly mode: 'mock' | 'client' | 'vblink';
  listRemoteGames(): Promise<RemoteGameSummary[]>;
  launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult>;
}
