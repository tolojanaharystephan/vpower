import { Logger } from '@nestjs/common';
import type { TranslationProvider } from './translation.types';

/**
 * Google Cloud Translation API v2 (REST).
 * @see https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */
export class GoogleTranslationProvider implements TranslationProvider {
  private readonly logger = new Logger(GoogleTranslationProvider.name);

  constructor(private readonly apiKey: string) {}

  async detect(text: string): Promise<string | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      const url = new URL('https://translation.googleapis.com/language/translate/v2/detect');
      url.searchParams.set('key', this.apiKey);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: trimmed }),
      });
      if (!res.ok) {
        this.logger.warn(`detect failed: ${res.status}`);
        return null;
      }
      const json = (await res.json()) as {
        data?: { detections?: Array<Array<{ language?: string }>> };
      };
      return json.data?.detections?.[0]?.[0]?.language ?? null;
    } catch (err) {
      this.logger.warn(`detect error: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async translate(text: string, targetLang: string, sourceLang?: string | null): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;
    const target = normalizeLang(targetLang);
    if (!target) return text;
    const source = sourceLang ? normalizeLang(sourceLang) : null;
    if (source && source === target) return text;

    try {
      const url = new URL('https://translation.googleapis.com/language/translate/v2');
      url.searchParams.set('key', this.apiKey);
      const body: Record<string, string> = {
        q: trimmed,
        target,
        format: 'text',
      };
      if (source) body.source = source;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        this.logger.warn(`translate failed: ${res.status}`);
        return text;
      }
      const json = (await res.json()) as {
        data?: { translations?: Array<{ translatedText?: string }> };
      };
      return json.data?.translations?.[0]?.translatedText ?? text;
    } catch (err) {
      this.logger.warn(`translate error: ${err instanceof Error ? err.message : String(err)}`);
      return text;
    }
  }
}

function normalizeLang(code: string): string {
  return code.trim().toLowerCase().split(/[-_]/)[0] ?? '';
}
