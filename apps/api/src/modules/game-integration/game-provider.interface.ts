export const GAME_PROVIDER = Symbol('GAME_PROVIDER');

export type LaunchSessionInput = {
  gameId: string;
  userId: string;
  locale?: string;
};

export type LaunchSessionResult = {
  mode: 'client' | 'vblink';
  gameId: string;
  slug: string;
  title: string;
  sessionId: string;
  /** Public VBlink Game Mainpage (no documented per-game launch URL). */
  launchUrl: string;
  message: string;
  /** VBlink player account created/ensured for this user (full_account when available). */
  vblinkAccount?: string;
  /** Technical password for manual login on VBlink (only when requiresManualLogin). */
  vblinkPassword?: string;
  /** True: PDF has no SSO — player logs in on VBlink with account + password. */
  requiresManualLogin?: boolean;
  plus100Account?: string;
  plus100Password?: string;
};

export type RemoteGameSummary = {
  externalId: string;
  slug: string;
  title: string;
};

export interface GameProvider {
  readonly mode: 'client' | 'vblink';
  listRemoteGames(): Promise<RemoteGameSummary[]>;
  launchSession(input: LaunchSessionInput): Promise<LaunchSessionResult>;
}
