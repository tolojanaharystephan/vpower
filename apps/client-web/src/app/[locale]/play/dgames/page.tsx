import { setRequestLocale } from 'next-intl/server';
import { DgamesPlayScreen } from '@/components/games/dgames-play-screen';

/** Portal entry for DGames — GamesAPI catalog + openGame + wallet callbacks. */
export default async function PlayDgamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DgamesPlayScreen />;
}
