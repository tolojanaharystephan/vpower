import type { TranslationProvider } from './translation.types';

/** No-op provider when TRANSLATION_ENABLED is false or no API key. */
export class PassthroughTranslationProvider implements TranslationProvider {
  async detect(_text: string): Promise<string | null> {
    return null;
  }

  async translate(text: string, _targetLang: string, _sourceLang?: string | null): Promise<string> {
    return text;
  }
}
