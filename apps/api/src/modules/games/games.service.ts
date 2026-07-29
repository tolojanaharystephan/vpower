import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, asc, desc, ilike, count, type SQL, type Column } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  gameProviders,
  gameCategories,
  games,
  type Game,
  type GameProvider,
  type GameCategory,
} from '../../database/schema';
import type { CreateGameDto, UpdateGameDto, QueryGamesDto, QueryCatalogGamesDto } from './dto';

export type GameWithRelations = Game & {
  provider: Pick<GameProvider, 'id' | 'name' | 'slug'>;
  category: Pick<GameCategory, 'id' | 'name' | 'slug'>;
};

@Injectable()
export class GamesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // ---------------------------------------------------------------------------
  // Games CRUD
  // ---------------------------------------------------------------------------

  async findAllGames(query: QueryGamesDto): Promise<{ data: GameWithRelations[]; total: number }> {
    const {
      search,
      categoryId,
      providerId,
      status,
      isFeatured,
      isNew,
      isPopular,
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = query;

    const conditions: SQL[] = [isNull(games.deletedAt)];
    if (search) conditions.push(ilike(games.title, `%${search}%`));
    if (categoryId) conditions.push(eq(games.categoryId, categoryId));
    if (providerId) conditions.push(eq(games.providerId, providerId));
    if (status) conditions.push(eq(games.status, status));
    if (isFeatured !== undefined) conditions.push(eq(games.isFeatured, isFeatured));
    if (isNew !== undefined) conditions.push(eq(games.isNew, isNew));
    if (isPopular !== undefined) conditions.push(eq(games.isPopular, isPopular));

    const where = and(...conditions);
    const orderFn = sortOrder === 'asc' ? asc : desc;
    const sortColumns: Record<string, Column> = {
      title: games.title,
      slug: games.slug,
      sortOrder: games.sortOrder,
      status: games.status,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
    };
    const sortCol = sortColumns[sortBy] ?? games.sortOrder;

    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.db
        .select({
          id: games.id,
          slug: games.slug,
          title: games.title,
          description: games.description,
          thumbnailUrl: games.thumbnailUrl,
          bannerUrl: games.bannerUrl,
          accent: games.accent,
          providerId: games.providerId,
          categoryId: games.categoryId,
          status: games.status,
          isFeatured: games.isFeatured,
          isNew: games.isNew,
          isPopular: games.isPopular,
          rtp: games.rtp,
          volatility: games.volatility,
          minBet: games.minBet,
          maxBet: games.maxBet,
          tags: games.tags,
          metaTitle: games.metaTitle,
          metaDescription: games.metaDescription,
          sortOrder: games.sortOrder,
          createdAt: games.createdAt,
          updatedAt: games.updatedAt,
          deletedAt: games.deletedAt,
          provider: { id: gameProviders.id, name: gameProviders.name, slug: gameProviders.slug },
          category: { id: gameCategories.id, name: gameCategories.name, slug: gameCategories.slug },
        })
        .from(games)
        .innerJoin(gameProviders, eq(games.providerId, gameProviders.id))
        .innerJoin(gameCategories, eq(games.categoryId, gameCategories.id))
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(games).where(where),
    ]);

    return { data, total: Number(countResult[0]?.total ?? 0) };
  }

  /** Public catalog: always force status=active. */
  async findCatalogGames(query: QueryCatalogGamesDto) {
    return this.findAllGames({ ...query, status: 'active' });
  }

  async findActiveCategories(): Promise<GameCategory[]> {
    return this.db
      .select()
      .from(gameCategories)
      .where(and(isNull(gameCategories.deletedAt), eq(gameCategories.isActive, true)))
      .orderBy(asc(gameCategories.sortOrder));
  }

  async findGameById(id: string): Promise<GameWithRelations | undefined> {
    const [game] = await this.db
      .select({
        id: games.id,
        slug: games.slug,
        title: games.title,
        description: games.description,
        thumbnailUrl: games.thumbnailUrl,
        bannerUrl: games.bannerUrl,
        accent: games.accent,
        providerId: games.providerId,
        categoryId: games.categoryId,
        status: games.status,
        isFeatured: games.isFeatured,
        isNew: games.isNew,
        isPopular: games.isPopular,
        rtp: games.rtp,
        volatility: games.volatility,
        minBet: games.minBet,
        maxBet: games.maxBet,
        tags: games.tags,
        metaTitle: games.metaTitle,
        metaDescription: games.metaDescription,
        sortOrder: games.sortOrder,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
        deletedAt: games.deletedAt,
        provider: { id: gameProviders.id, name: gameProviders.name, slug: gameProviders.slug },
        category: { id: gameCategories.id, name: gameCategories.name, slug: gameCategories.slug },
      })
      .from(games)
      .innerJoin(gameProviders, eq(games.providerId, gameProviders.id))
      .innerJoin(gameCategories, eq(games.categoryId, gameCategories.id))
      .where(eq(games.id, id))
      .limit(1);
    return game;
  }

  async findGameBySlug(slug: string): Promise<GameWithRelations | undefined> {
    const [game] = await this.db
      .select({
        id: games.id,
        slug: games.slug,
        title: games.title,
        description: games.description,
        thumbnailUrl: games.thumbnailUrl,
        bannerUrl: games.bannerUrl,
        accent: games.accent,
        providerId: games.providerId,
        categoryId: games.categoryId,
        status: games.status,
        isFeatured: games.isFeatured,
        isNew: games.isNew,
        isPopular: games.isPopular,
        rtp: games.rtp,
        volatility: games.volatility,
        minBet: games.minBet,
        maxBet: games.maxBet,
        tags: games.tags,
        metaTitle: games.metaTitle,
        metaDescription: games.metaDescription,
        sortOrder: games.sortOrder,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
        deletedAt: games.deletedAt,
        provider: { id: gameProviders.id, name: gameProviders.name, slug: gameProviders.slug },
        category: { id: gameCategories.id, name: gameCategories.name, slug: gameCategories.slug },
      })
      .from(games)
      .innerJoin(gameProviders, eq(games.providerId, gameProviders.id))
      .innerJoin(gameCategories, eq(games.categoryId, gameCategories.id))
      .where(eq(games.slug, slug))
      .limit(1);
    return game;
  }

  async createGame(dto: CreateGameDto): Promise<Game> {
    const [existing] = await this.db.select().from(games).where(eq(games.slug, dto.slug)).limit(1);
    if (existing) throw new ConflictException(`Game with slug "${dto.slug}" already exists`);

    const [game] = await this.db.insert(games).values(dto).returning();
    if (!game) throw new Error('Failed to create game');
    return game;
  }

  async updateGame(id: string, dto: UpdateGameDto): Promise<Game> {
    const existing = await this.findGameById(id);
    if (!existing) throw new NotFoundException('Game not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const [dup] = await this.db.select().from(games).where(eq(games.slug, dto.slug)).limit(1);
      if (dup) throw new ConflictException(`Game with slug "${dto.slug}" already exists`);
    }

    const [updated] = await this.db
      .update(games)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    if (!updated) throw new Error('Failed to update game');
    return updated;
  }

  async deleteGame(id: string): Promise<void> {
    const existing = await this.findGameById(id);
    if (!existing) throw new NotFoundException('Game not found');
    await this.db.update(games).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(games.id, id));
  }

  // ---------------------------------------------------------------------------
  // Categories CRUD
  // ---------------------------------------------------------------------------

  async findAllCategories(): Promise<GameCategory[]> {
    return this.db.select().from(gameCategories).where(isNull(gameCategories.deletedAt)).orderBy(asc(gameCategories.sortOrder));
  }

  async findCategoryById(id: string): Promise<GameCategory | undefined> {
    const [cat] = await this.db.select().from(gameCategories).where(eq(gameCategories.id, id)).limit(1);
    return cat;
  }

  async createCategory(dto: { name: string; slug: string; description?: string; sortOrder?: number; isActive?: boolean }): Promise<GameCategory> {
    const [existing] = await this.db.select().from(gameCategories).where(eq(gameCategories.slug, dto.slug)).limit(1);
    if (existing) throw new ConflictException(`Category with slug "${dto.slug}" already exists`);

    const [cat] = await this.db.insert(gameCategories).values(dto).returning();
    if (!cat) throw new Error('Failed to create category');
    return cat;
  }

  async updateCategory(id: string, dto: { name?: string; slug?: string; description?: string; sortOrder?: number; isActive?: boolean }): Promise<GameCategory> {
    const existing = await this.findCategoryById(id);
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const [dup] = await this.db.select().from(gameCategories).where(eq(gameCategories.slug, dto.slug)).limit(1);
      if (dup) throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
    }

    const [updated] = await this.db
      .update(gameCategories)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(gameCategories.id, id))
      .returning();
    if (!updated) throw new Error('Failed to update category');
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await this.findCategoryById(id);
    if (!existing) throw new NotFoundException('Category not found');
    await this.db.update(gameCategories).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(gameCategories.id, id));
  }

  // ---------------------------------------------------------------------------
  // Providers CRUD
  // ---------------------------------------------------------------------------

  async findAllProviders(): Promise<GameProvider[]> {
    return this.db.select().from(gameProviders).orderBy(asc(gameProviders.name));
  }

  async findProviderById(id: string): Promise<GameProvider | undefined> {
    const [p] = await this.db.select().from(gameProviders).where(eq(gameProviders.id, id)).limit(1);
    return p;
  }

  async createProvider(dto: { name: string; slug: string; baseUrl?: string; apiKey?: string; isActive?: boolean }): Promise<GameProvider> {
    const [existing] = await this.db.select().from(gameProviders).where(eq(gameProviders.slug, dto.slug)).limit(1);
    if (existing) throw new ConflictException(`Provider with slug "${dto.slug}" already exists`);

    const [provider] = await this.db.insert(gameProviders).values(dto).returning();
    if (!provider) throw new Error('Failed to create provider');
    return provider;
  }

  async updateProvider(id: string, dto: { name?: string; slug?: string; baseUrl?: string; apiKey?: string; isActive?: boolean }): Promise<GameProvider> {
    const existing = await this.findProviderById(id);
    if (!existing) throw new NotFoundException('Provider not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const [dup] = await this.db.select().from(gameProviders).where(eq(gameProviders.slug, dto.slug)).limit(1);
      if (dup) throw new ConflictException(`Provider with slug "${dto.slug}" already exists`);
    }

    const [updated] = await this.db
      .update(gameProviders)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(gameProviders.id, id))
      .returning();
    if (!updated) throw new Error('Failed to update provider');
    return updated;
  }

  async deleteProvider(id: string): Promise<void> {
    const existing = await this.findProviderById(id);
    if (!existing) throw new NotFoundException('Provider not found');
    await this.db.delete(gameProviders).where(eq(gameProviders.id, id));
  }
}
