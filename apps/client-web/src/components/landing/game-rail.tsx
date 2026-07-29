import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { GameTile } from '@/components/games/game-tile';
import type { CatalogGame } from '@/lib/catalog';

export async function GameRail({
  titleKey,
  games,
}: {
  titleKey: 'featured' | 'new' | 'popular';
  games: CatalogGame[];
}) {
  const t = await getTranslations('rails');

  if (!games.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--vp-fg)] sm:text-3xl">
          {t(titleKey)}
        </h2>
        <Link
          href="/games"
          className="text-sm text-[var(--vp-accent)] transition hover:text-[#e0b12a]"
        >
          {t('viewAll')}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
        {games.map((game) => (
          <GameTile key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
