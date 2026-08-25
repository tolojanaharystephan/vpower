import { setRequestLocale } from 'next-intl/server';
import { PlayLaunchScreen } from '@/components/games/play-launch-screen';

/** Portal entry for 100plus — lobby URL from launchGame. */
export default async function PlayPlus100Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlayLaunchScreen slug="100plus" title="100plus" />;
}
