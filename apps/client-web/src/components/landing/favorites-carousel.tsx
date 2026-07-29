'use client';

import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { CatalogGame } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AUTOPLAY_MS = 5500;

export function FavoritesCarousel({ games }: { games: CatalogGame[] }) {
  const t = useTranslations('carousel');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = games.length;

  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, count, go, index]);

  if (!count) return null;

  const active = games[index]!;

  return (
    <section
      className="relative border-y border-[rgba(245,240,232,0.06)] bg-[#09090c]"
      aria-roledescription="carousel"
      aria-label={t('title')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 pb-4 pt-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--vp-accent)]">
            {t('eyebrow')}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--vp-fg)] sm:text-3xl">
            {t('title')}
          </h2>
        </div>
        <Link
          href="/games"
          className="hidden text-sm text-[var(--vp-accent)] transition hover:text-[#e0b12a] sm:inline"
        >
          {t('viewAll')}
        </Link>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="carousel-stage relative overflow-hidden rounded-2xl">
          {games.map((game, i) => (
            <article
              key={game.id}
              className={cn(
                'carousel-slide absolute inset-0',
                i === index ? 'carousel-slide-active' : 'carousel-slide-idle',
              )}
              aria-hidden={i !== index}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 70% 80% at 75% 40%, ${game.accent}55 0%, transparent 55%),
                    radial-gradient(ellipse 50% 60% at 20% 80%, ${game.accent}22 0%, transparent 50%),
                    linear-gradient(135deg, #121218 0%, #0b0b0f 55%, #141018 100%)
                  `,
                }}
              />
              <div className="absolute inset-0 opacity-25 mix-blend-overlay hero-grid" aria-hidden />
              <div className="absolute inset-y-0 right-0 hidden w-[48%] md:block" aria-hidden>
                <div
                  className="carousel-art absolute inset-6 rounded-xl"
                  style={{
                    background: `linear-gradient(160deg, ${game.accent}99 0%, ${game.accent}33 40%, #0b0b0f 100%)`,
                    boxShadow: `0 0 60px ${game.accent}33`,
                  }}
                />
                <div className="absolute inset-6 rounded-xl border border-white/10" />
                <span
                  className="absolute bottom-10 right-10 font-[family-name:var(--font-display)] text-7xl font-extrabold tracking-tight text-white/10 lg:text-8xl"
                  aria-hidden
                >
                  777
                </span>
              </div>

              <div className="relative flex h-full min-h-[22rem] flex-col justify-end p-6 sm:min-h-[26rem] sm:p-10 lg:min-h-[28rem] lg:max-w-[52%] lg:justify-center">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--vp-muted)]">
                  {game.provider}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)] sm:text-4xl lg:text-5xl">
                  {game.title}
                </h3>
                <p className="mt-3 max-w-md text-sm text-[var(--vp-muted)] sm:text-base">
                  {game.blurb}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/games#${game.slug}`}>
                    <Button size="lg" className="btn-shine gap-2">
                      <Play className="h-4 w-4 fill-current" />
                      {t('play')}
                    </Button>
                  </Link>
                  <Link href="/games">
                    <Button size="lg" variant="secondary">
                      {t('browse')}
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {/* Keep height via invisible active placeholder structure — slides are absolute */}
          <div className="invisible min-h-[22rem] p-6 sm:min-h-[26rem] sm:p-10 lg:min-h-[28rem]" aria-hidden>
            <p className="text-xs uppercase tracking-[0.18em]">{active.provider}</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl">
              {active.title}
            </h3>
            <p className="mt-3 max-w-md text-sm sm:text-base">{active.blurb}</p>
            <div className="mt-6 h-12" />
          </div>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          <button
            type="button"
            className="carousel-nav left-3 sm:left-5"
            aria-label={t('prev')}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="carousel-nav right-3 sm:right-5"
            aria-label={t('next')}
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label={t('title')}>
            {games.map((game, i) => (
              <button
                key={game.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={game.title}
                className={cn('carousel-dot', i === index && 'carousel-dot-active')}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <p className="text-xs tabular-nums text-[var(--vp-muted)]">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </p>
        </div>

        {/* Thumbnail strip — 888-like secondary rail */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {games.map((game, i) => (
            <button
              key={game.id}
              type="button"
              onClick={() => go(i)}
              className={cn(
                'group relative h-20 w-32 shrink-0 overflow-hidden rounded-lg text-left transition sm:h-24 sm:w-40',
                i === index
                  ? 'ring-2 ring-[var(--vp-accent)]'
                  : 'opacity-70 ring-1 ring-white/10 hover:opacity-100',
              )}
              aria-label={game.title}
              aria-current={i === index}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(160deg, ${game.accent}88 0%, #14141a 70%)`,
                }}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] font-medium text-[var(--vp-fg)]">
                {game.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
