import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { supportBotFaqs, type SupportBotFaq } from '../../database/schema';

const DEFAULT_FAQS: Array<{
  keywords: string;
  question: string;
  answer: string;
  locale?: string;
  sortOrder: number;
}> = [
  {
    keywords: 'account compte register inscription signup create',
    question: 'How do I create an account?',
    answer:
      'Use Sign up on the home page, enter your email and password, then confirm when email verification is enabled. You can browse the catalog without an account.',
    locale: 'en',
    sortOrder: 10,
  },
  {
    keywords: 'compte inscription créer créer register email',
    question: 'Comment créer un compte ?',
    answer:
      'Utilisez Inscription sur l’accueil, renseignez email et mot de passe, puis confirmez lorsque la vérification email sera active. Le catalogue est consultable sans compte.',
    locale: 'fr',
    sortOrder: 11,
  },
  {
    keywords: 'deposit dépôt payment paiement wallet argent money',
    question: 'Are deposits available?',
    answer:
      'Payments and wallet features are not enabled yet (LOT 2). You can explore games and contact support for account questions in the meantime.',
    locale: 'en',
    sortOrder: 20,
  },
  {
    keywords: 'dépôt paiement portefeuille wallet argent',
    question: 'Les dépôts sont-ils disponibles ?',
    answer:
      'Les paiements et le portefeuille ne sont pas encore activés (LOT 2). Vous pouvez explorer les jeux et contacter le support pour le compte.',
    locale: 'fr',
    sortOrder: 21,
  },
  {
    keywords: 'game jeu play lancer launch catalog catalogue vblink',
    question: 'How do I play a game?',
    answer:
      'Sign in on VPower, open VBlink from the providers portal, then use “Open game” to enter www.vblink777.club with the account we create for you.',
    locale: 'en',
    sortOrder: 30,
  },
  {
    keywords: 'jeu jouer lancer catalogue play vblink',
    question: 'Comment lancer un jeu ?',
    answer:
      'Connectez-vous sur VPower, ouvrez VBlink depuis le portail, puis « Ouvrir le jeu » pour entrer sur www.vblink777.club avec le compte créé pour vous.',
    locale: 'fr',
    sortOrder: 31,
  },
  {
    keywords: 'password mot de passe reset forgot oublié',
    question: 'I forgot my password',
    answer:
      'Use the password reset flow from login when available, or open a human support ticket so an agent can help securely.',
    locale: 'en',
    sortOrder: 40,
  },
  {
    keywords: 'support human agent agent humain ticket help aide',
    question: 'I need a human agent',
    answer:
      'I can help with common questions. If you need a person, choose “Talk to an agent” to open a support ticket — our team will reply there.',
    locale: 'en',
    sortOrder: 50,
  },
];

@Injectable()
export class SupportBotService implements OnModuleInit {
  private readonly logger = new Logger(SupportBotService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onModuleInit() {
    const [row] = await this.db.select({ total: count() }).from(supportBotFaqs);
    if (Number(row?.total ?? 0) === 0) {
      await this.db.insert(supportBotFaqs).values(DEFAULT_FAQS);
      this.logger.log(`Seeded ${DEFAULT_FAQS.length} support bot FAQ entries`);
      return;
    }

    // Retire obsolete mock-mode FAQ copy if still present from earlier seeds.
    await this.db
      .update(supportBotFaqs)
      .set({
        answer:
          'Sign in on VPower, open VBlink from the providers portal, then use “Open game” to enter www.vblink777.club with the account we create for you.',
        keywords: 'game jeu play lancer launch catalog catalogue vblink',
        updatedAt: new Date(),
      })
      .where(eq(supportBotFaqs.question, 'How do I play a game?'));
    await this.db
      .update(supportBotFaqs)
      .set({
        answer:
          'Connectez-vous sur VPower, ouvrez VBlink depuis le portail, puis « Ouvrir le jeu » pour entrer sur www.vblink777.club avec le compte créé pour vous.',
        keywords: 'jeu jouer lancer catalogue play vblink',
        updatedAt: new Date(),
      })
      .where(eq(supportBotFaqs.question, 'Comment lancer un jeu ?'));
  }

  async listActive(locale?: string): Promise<SupportBotFaq[]> {
    const rows = await this.db
      .select()
      .from(supportBotFaqs)
      .where(eq(supportBotFaqs.isActive, true));
    const sorted = rows.sort((a, b) => a.sortOrder - b.sortOrder);
    if (!locale) return sorted;
    const preferred = sorted.filter((r) => !r.locale || r.locale === locale);
    return preferred.length ? preferred : sorted;
  }

  /**
   * Keyword match FAQ bot — quick / global answers without waiting for an agent.
   */
  async reply(input: { message: string; locale?: string }): Promise<{
    answer: string;
    matched: boolean;
    faqId: string | null;
    question: string | null;
    suggestHuman: boolean;
  }> {
    const text = input.message.trim().toLowerCase();
    if (!text) {
      return {
        answer: 'Please type a short question, or talk to a human agent.',
        matched: false,
        faqId: null,
        question: null,
        suggestHuman: true,
      };
    }

    const faqs = await this.listActive(input.locale);
    let best: { faq: SupportBotFaq; score: number } | null = null;

    for (const faq of faqs) {
      const keys = faq.keywords
        .toLowerCase()
        .split(/[\s,;]+/)
        .map((k) => k.trim())
        .filter(Boolean);
      let score = 0;
      for (const key of keys) {
        if (text.includes(key)) score += key.length >= 4 ? 2 : 1;
      }
      const qWords = faq.question.toLowerCase().split(/\s+/);
      for (const w of qWords) {
        if (w.length > 3 && text.includes(w)) score += 1;
      }
      if (!best || score > best.score) best = { faq, score };
    }

    if (!best || best.score < 2) {
      const fallback =
        input.locale === 'fr'
          ? 'Je n’ai pas trouvé de réponse rapide. Reformulez, ou parlez à un agent pour une aide personnalisée.'
          : 'I could not find a quick answer. Try rephrasing, or talk to a human agent for personal help.';
      return {
        answer: fallback,
        matched: false,
        faqId: null,
        question: null,
        suggestHuman: true,
      };
    }

    return {
      answer: best.faq.answer,
      matched: true,
      faqId: best.faq.id,
      question: best.faq.question,
      suggestHuman: best.score < 4,
    };
  }
}
