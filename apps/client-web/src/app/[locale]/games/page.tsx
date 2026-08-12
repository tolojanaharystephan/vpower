import { setRequestLocale, getTranslations } from 'next-intl/server';
import { GamesCatalog } from '@/components/games/games-catalog';
import { getPortalProvider } from '@/lib/portal';

export default async function GamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const { locale } = await params;
  const { provider: providerParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('gamesPage');
  const portalProvider = providerParam ? getPortalProvider(providerParam.toLowerCase()) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="page-header mb-2">
        <p className="page-header-eyebrow">VPower777</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[var(--vp-fg)] sm:text-5xl">
          {portalProvider ? portalProvider.name : t('title')}
        </h1>
        <p className="mt-3 max-w-xl text-[var(--vp-muted)] leading-relaxed">
          {portalProvider ? t('providerSubtitle', { name: portalProvider.name }) : t('subtitle')}
        </p>
      </div>
      <GamesCatalog />
    </div>
  );
}
