import { setRequestLocale } from 'next-intl/server';
import { VblinkEntryScreen } from '@/components/games/vblink-entry-screen';

export default async function VblinkPlayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VblinkEntryScreen />;
}
