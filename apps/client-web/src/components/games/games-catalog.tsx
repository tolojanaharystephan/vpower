'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { GameTile } from '@/components/games/game-tile';
import { BrandLoader } from '@/components/brand/brand-loader';
import { Link } from '@/i18n/navigation';
import { fetchCatalogGames, type GameTag } from '@/lib/catalog';
import { getPortalProvider } from '@/lib/portal';
import { cn } from '@/lib/utils';

type Filter = 'all' | GameTag;

export function GamesCatalog() {
  const t = useTranslations('gamesPage');
  const searchParams = useSearchParams();
  const providerSlug = searchParams.get('provider')?.toLowerCase() ?? '';
  const portalProvider = providerSlug ? getPortalProvider(providerSlug) : undefined;
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['catalog-games'],
    queryFn: () => fetchCatalogGames({ limit: 100 }),
  });

  const games = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.filter(
      (game) =>
        (!providerSlug || game.providerSlug === providerSlug) &&
        (filter === 'all' || game.tag === filter) &&
        (!normalizedQuery ||
          `${game.title} ${game.provider}`.toLowerCase().includes(normalizedQuery)),
    );
  }, [data, filter, query, providerSlug]);

  const filters: Filter[] = ['all', 'featured', 'new', 'popular'];

  return (
    <section className="mt-8">
      {portalProvider ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[rgba(46,163,242,0.28)] bg-[rgba(46,163,242,0.08)] px-4 py-3">
          <p className="text-sm text-[var(--vp-fg)]">
            {t('providerFilter', { name: portalProvider.name })}
          </p>
          <Link
            href="/providers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--vp-accent)] hover:text-[var(--vp-accent-bright)]"
          >
            <X className="h-3.5 w-3.5" />
            {t('clearProvider')}
          </Link>
        </div>
      ) : null}

      <div className="catalog-toolbar flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto rounded-lg border border-[rgba(245,240,232,0.08)] bg-black/25 p-1 scrollbar-none">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap transition',
                filter === item
                  ? 'bg-[rgba(46,163,242,0.18)] text-[var(--vp-accent-bright)] shadow-[0_0_16px_rgba(46,163,242,0.12)]'
                  : 'text-[var(--vp-muted)] hover:text-[var(--vp-fg)]',
              )}
            >
              {t(`filter.${item}`)}
            </button>
          ))}
        </div>

        <label className="relative block sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-md border border-[rgba(245,240,232,0.1)] bg-black/30 py-2.5 pl-9 pr-3 text-sm text-[var(--vp-fg)] outline-none transition placeholder:text-[var(--vp-muted)] focus:border-[rgba(46,163,242,0.55)] focus:shadow-[0_0_0_3px_rgba(46,163,242,0.1)]"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="mt-12 grid min-h-64 place-items-center">
          <BrandLoader size="md" label={t('loading')} />
        </div>
      ) : isError ? (
        <div className="cinema-panel mt-8 grid min-h-64 place-items-center border-dashed border-red-400/30 p-8 text-center">
          <p className="text-sm text-red-300">{t('loadError')}</p>
        </div>
      ) : games.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5">
          {games.map((game) => (
            <GameTile key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="cinema-panel mt-8 grid min-h-64 place-items-center border-dashed p-8 text-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--vp-fg)]">
              {t('emptyTitle')}
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--vp-muted)]">{t('emptyBody')}</p>
            <Link href="/play/vblink" className="mt-6 inline-block">
              <span className="text-sm font-semibold text-[var(--vp-accent)] hover:text-[var(--vp-accent-bright)]">
                VBlink →
              </span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
