import { getTranslations } from 'next-intl/server';
import { HeroCtas } from '@/components/landing/hero-ctas';

export async function HeroSection() {
  const t = await getTranslations('hero');

  return (
    <section className="relative flex min-h-[90svh] items-center overflow-hidden pt-20">
      <div className="absolute inset-0 hero-stage" aria-hidden />
      <div className="absolute inset-0 hero-vignette opacity-80" aria-hidden />
      <div className="hero-orb hero-orb-a opacity-70" aria-hidden />
      <div className="hero-orb hero-orb-b opacity-50" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vp-accent)] animate-fade-up">
            {t('eyebrow')}
          </p>
          <h1 className="max-w-xl whitespace-pre-line font-[family-name:var(--font-display)] text-4xl leading-[1.05] tracking-wide text-[var(--vp-fg)] sm:text-5xl lg:text-6xl animate-fade-up animate-delay-1">
            {t('headline')}
          </h1>
          <p className="mt-5 max-w-md text-base text-[var(--vp-muted)] sm:text-lg animate-fade-up animate-delay-2">
            {t('sub')}
          </p>
          <HeroCtas />
        </div>

        <div className="hero-stage-3d hidden lg:block" aria-hidden>
          <div className="hero-ring" />
          <div className="hero-tiles">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={`hero-tile hero-tile-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
