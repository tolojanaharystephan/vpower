import { setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/hero-section';
import { FavoritesCarousel } from '@/components/landing/favorites-carousel';
import { GameRail } from '@/components/landing/game-rail';
import { PromoStrip } from '@/components/landing/promo-strip';
import { favoriteGames, fetchCatalogGames, gamesByTag } from '@/lib/catalog';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let games: Awaited<ReturnType<typeof fetchCatalogGames>> = [];
  try {
    games = await fetchCatalogGames({ limit: 50 });
  } catch {
    games = [];
  }

  return (
    <>
      <HeroSection />
      <FavoritesCarousel games={favoriteGames(games)} />
      <GameRail titleKey="featured" games={gamesByTag(games, 'featured')} />
      <PromoStrip />
      <GameRail titleKey="new" games={gamesByTag(games, 'new')} />
      <GameRail titleKey="popular" games={gamesByTag(games, 'popular')} />
    </>
  );
}
