import { setRequestLocale } from 'next-intl/server';
import { PlayLaunchScreen } from '@/components/games/play-launch-screen';

/** Portal entry for VBlink — same launch UX as /play/[slug]. */
export default async function PlayVblinkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlayLaunchScreen slug="vblink" title="VBlink" />;
}
