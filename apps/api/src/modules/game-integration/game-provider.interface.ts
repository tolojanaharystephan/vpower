export const GAME_PROVIDER = Symbol('GAME_PROVIDER');

export type LaunchSessionInput = {
  gameId: string;
  userId: string;
  locale?: string;
};

export type LaunchSessionResult = {
  mode: 'mock' | 'client';
  gameId: string;
  slug: string;
  title: string;
  sessionId: string;
  launchUrl: string;
  message: string;
};

export type RemoteGameSummary = {
  externalId: string;
  slug: string;
  title: string;
};

/**
 * Internal contract for the external games partner.
 * Do not invent partner HTTP routes here — implement ClientGameProvider when docs arrive.
 */
export interface GameProvider {
  readonly mode: 'mock' | 'client';
  listRemoteGames(): Promise<RemoteGameSummary[]>;
  launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult>;
}
