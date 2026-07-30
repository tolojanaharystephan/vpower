import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { supportMessageTranslations, type SupportMessage } from '../../database/schema';
import { TRANSLATION_PROVIDER, type TranslationProvider } from './translation.types';

@Injectable()
export class TranslationService {
  constructor(
    @Inject(TRANSLATION_PROVIDER) private readonly provider: TranslationProvider,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  async detect(text: string): Promise<string | null> {
    return this.provider.detect(text);
  }

  /**
   * Resolve display body for a message in an arbitrary target language.
   * Uses DB cache; falls back to original when translation is off or same lang.
   */
  async resolveMessage(
    message: SupportMessage,
    targetLang?: string | null,
  ): Promise<{
    body: string;
    translatedBody: string | null;
    sourceLang: string | null;
    targetLang: string | null;
  }> {
    const sourceLang = message.sourceLang ?? null;
    const target = targetLang?.trim() ? normalizeLang(targetLang) : null;

    if (!target || (sourceLang && normalizeLang(sourceLang) === target)) {
      return {
        body: message.body,
        translatedBody: null,
        sourceLang,
        targetLang: target,
      };
    }

    const [cached] = await this.db
      .select()
      .from(supportMessageTranslations)
      .where(
        and(
          eq(supportMessageTranslations.messageId, message.id),
          eq(supportMessageTranslations.targetLang, target),
        ),
      )
      .limit(1);

    if (cached) {
      return {
        body: message.body,
        translatedBody: cached.body,
        sourceLang,
        targetLang: target,
      };
    }

    const translated = await this.provider.translate(message.body, target, sourceLang);
    if (translated !== message.body) {
      await this.db
        .insert(supportMessageTranslations)
        .values({
          messageId: message.id,
          targetLang: target,
          body: translated,
        })
        .onConflictDoNothing({
          target: [supportMessageTranslations.messageId, supportMessageTranslations.targetLang],
        });
    }

    return {
      body: message.body,
      translatedBody: translated === message.body ? null : translated,
      sourceLang,
      targetLang: target,
    };
  }
}

function normalizeLang(code: string): string {
  return code.trim().toLowerCase().split(/[-_]/)[0] ?? '';
}
