import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="page-header">
        <p className="page-header-eyebrow">Support</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          {t('title')}
        </h1>
        <p className="mt-3 text-[var(--vp-muted)]">{t('subtitle')}</p>
      </div>
      <div className="mt-8 space-y-3">
        {(['1', '2', '3', '4'] as const).map((question) => (
          <details key={question} className="faq-item" open={question === '1'}>
            <summary>{t(`q${question}`)}</summary>
            <p>{t(`a${question}`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
