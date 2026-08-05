import { setRequestLocale, getTranslations } from 'next-intl/server';
import { GamesCatalog } from '@/components/games/games-catalog';

export default async function GamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gamesPage');

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="page-header mb-2">
        <p className="page-header-eyebrow">VPower777</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[var(--vp-fg)] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-xl text-[var(--vp-muted)] leading-relaxed">{t('subtitle')}</p>
      </div>
      <GamesCatalog />
    </div>
  );
}
