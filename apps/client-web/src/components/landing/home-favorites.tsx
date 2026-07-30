'use client';

import { useQuery } from '@tanstack/react-query';
import { FavoritesCarousel } from '@/components/landing/favorites-carousel';
import { useSession } from '@/components/auth/session-provider';
import { favoriteGames, mapCatalogGame, type CatalogGame } from '@/lib/catalog';
import { listFavorites } from '@/lib/api';

/** Prefer user favorites when logged in; otherwise featured demo selection. */
export function HomeFavorites({ fallback }: { fallback: CatalogGame[] }) {
  const { accessToken, isAuthenticated, ready } = useSession();
  const { data } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(accessToken!),
    enabled: Boolean(ready && isAuthenticated && accessToken),
  });

  const games: CatalogGame[] =
    isAuthenticated && data && data.length
      ? data.map((g) =>
          mapCatalogGame({
            id: g.id,
            slug: g.slug,
            title: g.title,
            description: g.description,
            accent: g.accent,
            isFeatured: g.isFeatured,
            isNew: g.isNew,
            isPopular: g.isPopular,
            provider: g.provider,
          }),
        )
      : favoriteGames(fallback);

  return <FavoritesCarousel games={games} />;
}
