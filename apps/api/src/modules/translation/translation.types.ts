export type TranslationProvider = {
  detect(text: string): Promise<string | null>;
  translate(text: string, targetLang: string, sourceLang?: string | null): Promise<string>;
};

export const TRANSLATION_PROVIDER = Symbol('TRANSLATION_PROVIDER');
