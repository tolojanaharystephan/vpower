import { z } from 'zod';

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('vpower777'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL: z.string().url().default('http://localhost:3001'),
  API_URL: z.string().url().default('http://localhost:4000'),
  API_PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  GAME_API_BASE_URL: z.string().url().optional().or(z.literal('')),
  GAME_API_KEY: z.string().optional().default(''),
  GAME_API_SECRET: z.string().optional().default(''),
  GAME_API_TIMEOUT: z.coerce.number().int().positive().default(10000),
  /** Live partner mode only (VBlink). Mock removed. */
  GAME_PROVIDER_MODE: z.enum(['client']).default('client'),

  /** VBlink FastAPI credentials (required). */
  VBLINK_ENABLED: booleanFromEnv.default(false),
  VBLINK_API_BASE_URL: z.string().url(),
  VBLINK_APP_ID: z.string().min(1),
  VBLINK_APP_SECRET: z.string().min(1),
  /** AES key for VBlink player passwords stored in DB. */
  VBLINK_ENCRYPTION_KEY: z.string().min(32),
  VBLINK_AGENT_ACCOUNT: z.string().min(1),
  VBLINK_LOBBY_URL: z.string().url().optional().or(z.literal('')).default('https://www.vblink777.club'),
  VBLINK_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  /** 100Plus game provider (optional until the module is wired). */
  PLUS100_API_URL: z.string().url().optional().or(z.literal('')).default(''),
  PLUS100_AGENT_ID: z.string().optional().default(''),
  PLUS100_SECRET_KEY: z.string().optional().default(''),

  GOOGLE_TRANSLATION_API_KEY: z.string().optional().default(''),
  TRANSLATION_ENABLED: booleanFromEnv.default(false),

  PAYMENTS_ENABLED: booleanFromEnv.default(false),
  LIVE_GAMES_ENABLED: booleanFromEnv.default(false),

  SENTRY_DSN: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /** Optional bootstrap staff account (dev / first deploy). */
  SEED_ADMIN_EMAIL: z.union([z.string().email(), z.literal('')]).default(''),
  SEED_ADMIN_PASSWORD: z.union([z.string().min(8), z.literal('')]).default(''),
  SEED_ADMIN_ROLE: z
    .enum(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_AGENT', 'CONTENT_MANAGER'])
    .default('SUPER_ADMIN'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}
