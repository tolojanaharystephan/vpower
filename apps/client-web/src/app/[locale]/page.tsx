import { setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/hero-section';
import { FavoritesCarousel } from '@/components/landing/favorites-carousel';
import { GameRail } from '@/components/landing/game-rail';
import { PromoStrip } from '@/components/landing/promo-strip';
import { favoriteGames, gamesByTag } from '@/lib/mock-games';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <FavoritesCarousel games={favoriteGames()} />
      <GameRail titleKey="featured" games={gamesByTag('featured')} />
      <PromoStrip />
      <GameRail titleKey="new" games={gamesByTag('new')} />
      <GameRail titleKey="popular" games={gamesByTag('popular')} />
    </>
  );
}
