import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { gameProviders, gameCategories, games } from '../../database/schema';

const PROVIDERS = [
  { name: 'Studio A', slug: 'studio-a' },
  { name: 'Studio B', slug: 'studio-b' },
  { name: 'Studio C', slug: 'studio-c' },
] as const;

const CATEGORIES = [
  { name: 'Slots', slug: 'slots', description: 'Video slots & reels', sortOrder: 1 },
  { name: 'Table', slug: 'table', description: 'Cards & table games', sortOrder: 2 },
  { name: 'Jackpot', slug: 'jackpot', description: 'Progressive & fixed jackpots', sortOrder: 3 },
] as const;

type SeedGame = {
  slug: string;
  title: string;
  description: string;
  providerSlug: string;
  categorySlug: string;
  accent: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  sortOrder: number;
};

const SEED_GAMES: SeedGame[] = [
  {
    slug: 'neon-reels',
    title: 'Neon Reels',
    description: 'Rouleaux électriques, jackpots qui claquent. / Electric reels, jackpots that hit hard.',
    providerSlug: 'studio-a',
    categorySlug: 'slots',
    accent: '#D4A017',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: 'obsidian-spin',
    title: 'Obsidian Spin',
    description: 'Spin sombre, gains qui brûlent. / Dark spin, fiery wins.',
    providerSlug: 'studio-b',
    categorySlug: 'slots',
    accent: '#C45C26',
    isFeatured: true,
    sortOrder: 2,
  },
  {
    slug: 'gold-circuit',
    title: 'Gold Circuit',
    description: 'Circuit doré pour les chasseurs de bonus. / Golden circuit for bonus hunters.',
    providerSlug: 'studio-a',
    categorySlug: 'jackpot',
    accent: '#E8C547',
    isPopular: true,
    sortOrder: 3,
  },
  {
    slug: 'velvet-ace',
    title: 'Velvet Ace',
    description: 'Cartes velours, ambiance salon privé. / Velvet cards, private-room vibes.',
    providerSlug: 'studio-c',
    categorySlug: 'table',
    accent: '#8B3A3A',
    isNew: true,
    sortOrder: 4,
  },
  {
    slug: 'aurora-jack',
    title: 'Aurora Jack',
    description: 'Aurores boréales et multiplies sauvages. / Northern lights and wild multipliers.',
    providerSlug: 'studio-b',
    categorySlug: 'jackpot',
    accent: '#3D7EA6',
    isNew: true,
    sortOrder: 5,
  },
  {
    slug: 'ember-wheel',
    title: 'Ember Wheel',
    description: 'La roue de braise tourne encore. / The ember wheel keeps spinning.',
    providerSlug: 'studio-c',
    categorySlug: 'slots',
    accent: '#B33B1E',
    isPopular: true,
    sortOrder: 6,
  },
  {
    slug: 'midnight-flush',
    title: 'Midnight Flush',
    description: 'Poker de minuit, tension maximale. / Midnight poker, maximum tension.',
    providerSlug: 'studio-a',
    categorySlug: 'table',
    accent: '#5C4B8A',
    isFeatured: true,
    sortOrder: 7,
  },
  {
    slug: 'crystal-run',
    title: 'Crystal Run',
    description: 'Course de cristaux, free spins en chaîne. / Crystal rush, chained free spins.',
    providerSlug: 'studio-b',
    categorySlug: 'slots',
    accent: '#2F6F6A',
    isNew: true,
    sortOrder: 8,
  },
];

/**
 * Bootstrap catalog when empty — mirrors mock client titles for Phase 6 sync.
 */
@Injectable()
export class GamesSeedService implements OnModuleInit {
  private readonly logger = new Logger(GamesSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onModuleInit() {
    const [countRow] = await this.db.select({ total: count() }).from(games);
    if (Number(countRow?.total ?? 0) > 0) {
      this.logger.log('Games catalog already seeded — skip');
      return;
    }

    const providerIds = new Map<string, string>();
    for (const p of PROVIDERS) {
      const [existing] = await this.db
        .select()
        .from(gameProviders)
        .where(eq(gameProviders.slug, p.slug))
        .limit(1);
      if (existing) {
        providerIds.set(p.slug, existing.id);
        continue;
      }
      const [created] = await this.db.insert(gameProviders).values(p).returning();
      if (created) providerIds.set(p.slug, created.id);
    }

    const categoryIds = new Map<string, string>();
    for (const c of CATEGORIES) {
      const [existing] = await this.db
        .select()
        .from(gameCategories)
        .where(eq(gameCategories.slug, c.slug))
        .limit(1);
      if (existing) {
        categoryIds.set(c.slug, existing.id);
        continue;
      }
      const [created] = await this.db.insert(gameCategories).values(c).returning();
      if (created) categoryIds.set(c.slug, created.id);
    }

    for (const g of SEED_GAMES) {
      const providerId = providerIds.get(g.providerSlug);
      const categoryId = categoryIds.get(g.categorySlug);
      if (!providerId || !categoryId) continue;

      await this.db.insert(games).values({
        slug: g.slug,
        title: g.title,
        description: g.description,
        accent: g.accent,
        providerId,
        categoryId,
        status: 'active',
        isFeatured: g.isFeatured ?? false,
        isNew: g.isNew ?? false,
        isPopular: g.isPopular ?? false,
        sortOrder: g.sortOrder,
        tags: [
          ...(g.isFeatured ? ['featured'] : []),
          ...(g.isNew ? ['new'] : []),
          ...(g.isPopular ? ['popular'] : []),
        ],
      });
    }

    this.logger.log(`Seeded ${SEED_GAMES.length} games, ${PROVIDERS.length} providers, ${CATEGORIES.length} categories`);
  }
}
