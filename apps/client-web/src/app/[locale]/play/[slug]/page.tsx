import { setRequestLocale } from 'next-intl/server';
import { PlayLaunchScreen } from '@/components/games/play-launch-screen';
import { fetchCatalogGames } from '@/lib/catalog';

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale, slug } = await params;
  const { id: gameIdFromQuery } = await searchParams;
  setRequestLocale(locale);

  let title: string | undefined;
  let gameId = gameIdFromQuery;

  try {
    const games = await fetchCatalogGames({ limit: 100 });
    const match = games.find((g) => g.slug === slug);
    title = match?.title;
    if (!gameId && match) gameId = match.id;
  } catch {
    title = undefined;
  }

  return <PlayLaunchScreen slug={slug} title={title} gameId={gameId} />;
}
