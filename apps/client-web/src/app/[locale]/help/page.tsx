import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CircleHelp, Gift, Gamepad2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('help');

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="page-header">
        <p className="page-header-eyebrow">VPower777</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--vp-muted)]">{t('subtitle')}</p>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        <Link href="/faq" className="help-card">
          <CircleHelp className="h-6 w-6 text-[var(--vp-accent)]" />
          <h2>{t('cardFaqTitle')}</h2>
          <p>{t('cardFaqBody')}</p>
        </Link>
        <Link href="/games" className="help-card">
          <Gamepad2 className="h-6 w-6 text-[var(--vp-accent)]" />
          <h2>{t('cardGamesTitle')}</h2>
          <p>{t('cardGamesBody')}</p>
        </Link>
        <Link href="/promotions" className="help-card">
          <Gift className="h-6 w-6 text-[var(--vp-accent)]" />
          <h2>{t('cardPromosTitle')}</h2>
          <p>{t('cardPromosBody')}</p>
        </Link>
      </div>
    </div>
  );
}
