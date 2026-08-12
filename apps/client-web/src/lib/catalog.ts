import { getApiBaseUrl } from './utils';

export type GameTag = 'featured' | 'new' | 'popular';

export type CatalogGame = {
  id: string;
  slug: string;
  title: string;
  provider: string;
  providerSlug: string;
  tag: GameTag;
  accent: string;
  blurb: string;
  /** Featured games surface in the home carousel until real favorites API. */
  favorite?: boolean;
};

type CatalogApiGame = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  accent?: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  provider: { id: string; name: string; slug: string };
};

function primaryTag(game: CatalogApiGame): GameTag {
  if (game.isFeatured) return 'featured';
  if (game.isNew) return 'new';
  return 'popular';
}

export function mapCatalogGame(game: CatalogApiGame): CatalogGame {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    provider: game.provider.name,
    providerSlug: game.provider.slug,
    tag: primaryTag(game),
    accent: game.accent || '#D4A017',
    blurb: game.description?.trim() || game.title,
    favorite: game.isFeatured,
  };
}

export async function fetchCatalogGames(params?: {
  search?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  limit?: number;
}): Promise<CatalogGame[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params?.limit ?? 50));
  query.set('sortBy', 'sortOrder');
  query.set('sortOrder', 'asc');
  if (params?.search) query.set('search', params.search);
  if (params?.isFeatured !== undefined) query.set('isFeatured', String(params.isFeatured));
  if (params?.isNew !== undefined) query.set('isNew', String(params.isNew));
  if (params?.isPopular !== undefined) query.set('isPopular', String(params.isPopular));

  const res = await fetch(`${getApiBaseUrl()}/api/v1/catalog/games?${query}`, {
    ...(typeof window === 'undefined'
      ? { next: { revalidate: 30 } }
      : { cache: 'no-store' as RequestCache }),
  });
  if (!res.ok) {
    throw new Error(`Catalog request failed (${res.status})`);
  }
  const body = (await res.json()) as { data: CatalogApiGame[]; total: number };
  return body.data.map(mapCatalogGame);
}

export function gamesByTag(games: CatalogGame[], tag: GameTag) {
  return games.filter((g) => g.tag === tag);
}

export function favoriteGames(games: CatalogGame[]) {
  const featured = games.filter((g) => g.favorite);
  return featured.length ? featured : games.slice(0, 5);
}
