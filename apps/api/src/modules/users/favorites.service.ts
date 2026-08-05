import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import {
  gameProviders,
  games,
  userFavorites,
} from '../../database/schema';

@Injectable()
export class FavoritesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listForUser(userId: string) {
    return this.db
      .select({
        id: games.id,
        slug: games.slug,
        title: games.title,
        description: games.description,
        accent: games.accent,
        isFeatured: games.isFeatured,
        isNew: games.isNew,
        isPopular: games.isPopular,
        provider: {
          id: gameProviders.id,
          name: gameProviders.name,
          slug: gameProviders.slug,
        },
      })
      .from(userFavorites)
      .innerJoin(games, eq(userFavorites.gameId, games.id))
      .innerJoin(gameProviders, eq(games.providerId, gameProviders.id))
      .where(and(eq(userFavorites.userId, userId), isNull(games.deletedAt), eq(games.status, 'active')))
      .orderBy(asc(games.sortOrder));
  }

  async add(userId: string, gameId: string) {
    const [game] = await this.db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), isNull(games.deletedAt), eq(games.status, 'active')))
      .limit(1);
    if (!game) throw new NotFoundException('Game not found');

    const [existing] = await this.db
      .select()
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.gameId, gameId)))
      .limit(1);
    if (existing) throw new ConflictException('Already in favorites');

    await this.db.insert(userFavorites).values({ userId, gameId });
    return { success: true };
  }

  async remove(userId: string, gameId: string) {
    await this.db
      .delete(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.gameId, gameId)));
    return { success: true };
  }
}
