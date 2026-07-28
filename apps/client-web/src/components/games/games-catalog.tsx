'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GameTile } from '@/components/games/game-tile';
import { MOCK_GAMES, type MockGame } from '@/lib/mock-games';
import { cn } from '@/lib/utils';

type Filter = 'all' | MockGame['tag'];

export function GamesCatalog() {
  const t = useTranslations('gamesPage');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const games = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return MOCK_GAMES.filter(
      (game) =>
        (filter === 'all' || game.tag === filter) &&
        (!normalizedQuery ||
          `${game.title} ${game.provider}`.toLowerCase().includes(normalizedQuery)),
    );
  }, [filter, query]);

  const filters: Filter[] = ['all', 'featured', 'new', 'popular'];

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-4 border-y border-[rgba(245,240,232,0.08)] py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition',
                filter === item
                  ? 'border-[rgba(212,160,23,0.55)] bg-[rgba(212,160,23,0.14)] text-[var(--vp-accent)]'
                  : 'border-[rgba(245,240,232,0.1)] text-[var(--vp-muted)] hover:border-[rgba(245,240,232,0.24)] hover:text-[var(--vp-fg)]',
              )}
            >
              {t(`filter.${item}`)}
            </button>
          ))}
        </div>

        <label className="relative block sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-lg border border-[rgba(245,240,232,0.1)] bg-black/20 py-2 pl-9 pr-3 text-sm text-[var(--vp-fg)] outline-none transition placeholder:text-[var(--vp-muted)] focus:border-[rgba(212,160,23,0.55)]"
          />
        </label>
      </div>

      {games.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <GameTile key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid min-h-64 place-items-center rounded-xl border border-dashed border-[rgba(245,240,232,0.14)] bg-[rgba(20,20,26,0.45)] p-8 text-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--vp-fg)]">
              {t('emptyTitle')}
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--vp-muted)]">{t('emptyBody')}</p>
          </div>
        </div>
      )}
    </section>
  );
}
