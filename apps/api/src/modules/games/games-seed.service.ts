import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ROOM_NAMES, ROOM_SLUGS } from '@vpower777/types';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { gameProviders, gameCategories, games } from '../../database/schema';

const PORTAL_PROVIDERS = ROOM_SLUGS.map((slug) => ({ name: ROOM_NAMES[slug], slug }));

const CATEGORIES = [
  { name: 'Slots', slug: 'slots', description: 'Video slots & reels', sortOrder: 1 },
  { name: 'Table', slug: 'table', description: 'Cards & table games', sortOrder: 2 },
  { name: 'Jackpot', slug: 'jackpot', description: 'Progressive & fixed jackpots', sortOrder: 3 },
] as const;

/** Legacy Phase-6 placeholder titles — removed from the live catalog. */
const PLACEHOLDER_GAME_SLUGS = [
  'neon-reels',
  'obsidian-spin',
  'gold-circuit',
  'velvet-ace',
  'aurora-jack',
  'ember-wheel',
  'midnight-flush',
  'crystal-run',
] as const;

/**
 * Ensures portal partner rows exist. Does not invent game titles —
 * catalog games are admin-managed or come from partner APIs.
 */
@Injectable()
export class GamesSeedService implements OnModuleInit {
  private readonly logger = new Logger(GamesSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onModuleInit() {
    await this.ensurePortalProviders();
    await this.ensureCategories();
    await this.retirePlaceholderGames();
  }

  private async ensurePortalProviders() {
    for (const p of PORTAL_PROVIDERS) {
      const [existing] = await this.db
        .select()
        .from(gameProviders)
        .where(eq(gameProviders.slug, p.slug))
        .limit(1);
      if (existing) continue;
      await this.db.insert(gameProviders).values({ ...p, isActive: true });
      this.logger.log(`Ensured portal provider: ${p.slug}`);
    }

    const legacy = await this.db.select().from(gameProviders);
    const bySlug = new Map(legacy.map((p) => [p.slug, p.id]));
    const remap: Array<[string, string]> = [
      ['studio-a', 'vblink'],
      ['studio-b', 'goldendragon'],
      ['studio-c', 'magiccity'],
    ];
    for (const [from, to] of remap) {
      const fromId = bySlug.get(from);
      const toId = bySlug.get(to);
      if (!fromId || !toId) continue;
      await this.db.update(games).set({ providerId: toId }).where(eq(games.providerId, fromId));
    }
  }

  private async ensureCategories() {
    for (const c of CATEGORIES) {
      const [existing] = await this.db
        .select()
        .from(gameCategories)
        .where(eq(gameCategories.slug, c.slug))
        .limit(1);
      if (existing) continue;
      await this.db.insert(gameCategories).values(c);
      this.logger.log(`Ensured category: ${c.slug}`);
    }
  }

  private async retirePlaceholderGames() {
    const retired = await this.db
      .update(games)
      .set({
        status: 'inactive',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(inArray(games.slug, [...PLACEHOLDER_GAME_SLUGS]), isNull(games.deletedAt)),
      )
      .returning({ slug: games.slug });

    if (retired.length) {
      this.logger.log(
        `Retired ${retired.length} placeholder catalog games: ${retired.map((g) => g.slug).join(', ')}`,
      );
    }
  }
}
