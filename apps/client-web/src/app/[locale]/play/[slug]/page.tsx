import { setRequestLocale } from 'next-intl/server';
import { PlayDemoScreen } from '@/components/games/play-demo-screen';
import { fetchCatalogGames } from '@/lib/catalog';

export default async function PlayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let title: string | undefined;
  try {
    const games = await fetchCatalogGames({ limit: 100 });
    title = games.find((g) => g.slug === slug)?.title;
  } catch {
    title = undefined;
  }

  return <PlayDemoScreen slug={slug} title={title} />;
}
