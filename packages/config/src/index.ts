import type { FeatureFlags, Locale } from '@vpower777/types';

/** Centralized non-secret app configuration. Secrets stay in env (Phase 1+). */

export const SUPPORTED_LOCALES: readonly Locale[] = ['fr', 'en', 'es', 'de'] as const;

export const DEFAULT_LOCALE: Locale = 'fr';

export const APP_PORTS = {
  client: 3000,
  admin: 3001,
  api: 4000,
} as const;

export const BRAND = {
  name: 'VPower777',
  tagline: 'L\'expérience jeu nouvelle génération',
  /** Dark cinema + amber/gold — Phase 4 design system will expand tokens. */
  colors: {
    background: '#0B0B0F',
    surface: '#14141A',
    accent: '#D4A017',
    accentMuted: '#B8860B',
    foreground: '#F5F0E8',
    muted: '#9A958C',
  },
} as const;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  paymentsEnabled: false,
  liveGamesEnabled: false,
  translationEnabled: false,
};

export const API_PREFIX = '/api/v1';
