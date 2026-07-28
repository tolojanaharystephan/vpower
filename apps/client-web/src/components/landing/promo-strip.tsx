import { getTranslations } from 'next-intl/server';

export async function PromoStrip() {
  const t = await getTranslations('promos');

  return (
    <section className="relative overflow-hidden border-y border-[rgba(245,240,232,0.08)] bg-[rgba(20,20,26,0.55)]">
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-[rgba(212,160,23,0.08)] blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)]">
          {t('title')}
        </h2>
        <p className="mt-2 max-w-xl text-[var(--vp-muted)]">{t('subtitle')}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="promo-panel transition duration-300 hover:bg-[rgba(212,160,23,0.12)]">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-accent)]">
              {t('welcomeTitle')}
            </h3>
            <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('welcomeBody')}</p>
          </div>
          <div className="promo-panel transition duration-300 hover:bg-[rgba(212,160,23,0.12)]">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-accent)]">
              {t('weeklyTitle')}
            </h3>
            <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('weeklyBody')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
