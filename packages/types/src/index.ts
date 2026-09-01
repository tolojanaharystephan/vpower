/** Shared domain contracts for client, admin, and API. Phase 0 stubs only. */

export type Locale = 'fr' | 'en' | 'es' | 'nl' | 'zh' | 'ko' | 'ja' | 'mn';

export type FeatureFlags = {
  paymentsEnabled: boolean;
  liveGamesEnabled: boolean;
  translationEnabled: boolean;
};

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  correlationId?: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type HealthStatus = {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
};

/** Live game partner mode (VBlink FastAPI). */
export type GameProviderMode = 'client';

export * from './roles';
