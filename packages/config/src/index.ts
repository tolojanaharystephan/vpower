import type { FeatureFlags, Locale } from '@vpower777/types';

export type { Locale } from '@vpower777/types';

/** Centralized non-secret app configuration. Secrets stay in env (Phase 1+). */

export const SUPPORTED_LOCALES: readonly Locale[] = [
  'fr',
  'en',
  'es',
  'nl',
  'zh',
  'ko',
  'ja',
  'mn',
] as const;

export const DEFAULT_LOCALE: Locale = 'fr';

/** Native labels for the player language menu. */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  nl: 'Nederlands',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  mn: 'Монгол',
};

export const LOCALE_DATE_TAGS: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  nl: 'nl-NL',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ja: 'ja-JP',
  mn: 'mn-MN',
};

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function dateTagFor(locale: string): string {
  return isLocale(locale) ? LOCALE_DATE_TAGS[locale] : LOCALE_DATE_TAGS[DEFAULT_LOCALE];
}

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
