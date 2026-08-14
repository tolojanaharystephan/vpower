import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get apiPort(): number {
    return this.config.get('API_PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string {
    return this.config.get('REDIS_URL', { infer: true });
  }

  get featureFlags() {
    return {
      paymentsEnabled: this.config.get('PAYMENTS_ENABLED', { infer: true }),
      liveGamesEnabled: this.config.get('LIVE_GAMES_ENABLED', { infer: true }),
      translationEnabled: this.config.get('TRANSLATION_ENABLED', { infer: true }),
    };
  }

  get gameProviderMode(): AppEnv['GAME_PROVIDER_MODE'] {
    return this.config.get('GAME_PROVIDER_MODE', { infer: true });
  }

  get gameApiBaseUrl(): string {
    return this.config.get('GAME_API_BASE_URL', { infer: true }) || '';
  }

  get gameApiKey(): string {
    return this.config.get('GAME_API_KEY', { infer: true }) || '';
  }

  get gameApiSecret(): string {
    return this.config.get('GAME_API_SECRET', { infer: true }) || '';
  }

  get gameApiTimeout(): number {
    return this.config.get('GAME_API_TIMEOUT', { infer: true });
  }

  get vblink() {
    const enabled = this.config.get('VBLINK_ENABLED', { infer: true });
    const appId = this.config.get('VBLINK_APP_ID', { infer: true });
    const appSecret = this.config.get('VBLINK_APP_SECRET', { infer: true });
    const encryptionKey = this.config.get('VBLINK_ENCRYPTION_KEY', { infer: true });
    const agentAccount = this.config.get('VBLINK_AGENT_ACCOUNT', { infer: true });
    const lobbyUrl = (
      this.config.get('VBLINK_LOBBY_URL', { infer: true }) || 'https://www.vblink777.club'
    ).replace(/\/$/, '');
    const apiBaseUrl = this.config.get('VBLINK_API_BASE_URL', { infer: true }).replace(/\/$/, '');
    return {
      enabled,
      apiBaseUrl,
      appId,
      appSecret,
      encryptionKey,
      agentAccount,
      lobbyUrl,
      timeoutMs: this.config.get('VBLINK_TIMEOUT_MS', { infer: true }),
    };
  }

  get logLevel(): AppEnv['LOG_LEVEL'] {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get appUrl(): string {
    return this.config.get('APP_URL', { infer: true });
  }

  get adminUrl(): string {
    return this.config.get('ADMIN_URL', { infer: true });
  }

  get apiUrl(): string {
    return this.config.get('API_URL', { infer: true });
  }

  get seedAdminEmail(): string {
    return this.config.get('SEED_ADMIN_EMAIL', { infer: true }) || '';
  }

  get seedAdminPassword(): string {
    return this.config.get('SEED_ADMIN_PASSWORD', { infer: true }) || '';
  }

  get seedAdminRole() {
    return this.config.get('SEED_ADMIN_ROLE', { infer: true });
  }

  get translationEnabled(): boolean {
    return this.config.get('TRANSLATION_ENABLED', { infer: true });
  }

  get googleTranslationApiKey(): string {
    return this.config.get('GOOGLE_TRANSLATION_API_KEY', { infer: true }) || '';
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }

  /** Strict CORS allowlist for browser clients. */
  get corsOrigins(): string[] {
    return [this.appUrl, this.adminUrl, this.apiUrl];
  }
}
