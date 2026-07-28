import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PromoStrip } from '@/components/landing/promo-strip';

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('promos');

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="page-header">
          <p className="page-header-eyebrow">VPower777</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          {t('title')}
        </h1>
          <p className="mt-3 max-w-xl text-[var(--vp-muted)]">{t('subtitle')}</p>
        </div>
      </div>
      <PromoStrip />
    </div>
  );
}
