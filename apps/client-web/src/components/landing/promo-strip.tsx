import { getTranslations } from 'next-intl/server';

export async function PromoStrip() {
  const t = await getTranslations('promos');

  return (
    <section className="relative overflow-hidden border-y border-[rgba(245,240,232,0.08)] bg-[rgba(18,16,12,0.65)]">
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-[rgba(212,160,23,0.1)] blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)]">
          {t('title')}
        </h2>
        <p className="mt-2 max-w-xl text-[var(--vp-muted)]">{t('subtitle')}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="promo-panel cinema-panel p-5 transition duration-300 hover:border-[rgba(212,160,23,0.35)]">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-accent-bright)]">
              {t('welcomeTitle')}
            </h3>
            <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('welcomeBody')}</p>
          </div>
          <div className="promo-panel cinema-panel p-5 transition duration-300 hover:border-[rgba(212,160,23,0.35)]">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-accent-bright)]">
              {t('weeklyTitle')}
            </h3>
            <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('weeklyBody')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
