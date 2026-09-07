import { setRequestLocale } from 'next-intl/server';
import { PlayLaunchScreen } from '@/components/games/play-launch-screen';

/** Portal entry for Dragon Fury — FastAPI create + Game Mainpage login. */
export default async function PlayDragonfuryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlayLaunchScreen slug="dragonfury" title="Dragon Fury" />;
}
