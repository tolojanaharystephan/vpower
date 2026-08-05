import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CareAtmosphere } from '@/components/help/care-atmosphere';

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');

  return (
    <div className="care-shell mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <section className="care-hero">
        <div className="animate-fade-up">
          <p className="care-kicker">{t('eyebrow')}</p>
          <h1 className="care-title">{t('title')}</h1>
          <p className="care-lede">{t('subtitle')}</p>
          <p className="mt-6 text-sm text-[var(--vp-muted)]">
            {t('supportHint')}{' '}
            <Link
              href="/support"
              className="font-medium text-[var(--vp-accent)] underline-offset-4 hover:underline"
            >
              {t('supportLink')}
            </Link>
          </p>
        </div>
        <CareAtmosphere label={t('visualLabel')} className="animate-fade-up max-w-[18rem]" />
      </section>

      <div className="mt-12 space-y-3">
        {(['1', '2', '3', '4'] as const).map((question) => (
          <details key={question} className="faq-item animate-fade-up" open={question === '1'}>
            <summary>{t(`q${question}`)}</summary>
            <p>{t(`a${question}`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
