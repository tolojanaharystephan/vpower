import { Link } from '@/i18n/navigation';
import type { CatalogGame } from '@/lib/catalog';
import { cn } from '@/lib/utils';

export function GameTile({ game, className }: { game: CatalogGame; className?: string }) {
  return (
    <article
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-lg outline-none transition duration-300 will-change-transform hover:-translate-y-1.5',
        className,
      )}
    >
      <div
        className="absolute inset-0 transition duration-500 group-hover:scale-105"
        style={{
          background: `linear-gradient(160deg, ${game.accent}66 0%, #14141a 55%, #0b0b0f 100%)`,
        }}
      />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay hero-grid" />
      <div className="game-tile-sheen" aria-hidden />
      <div className="game-tile-ring" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 sm:p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--vp-muted)]">
          {game.provider}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--vp-fg)] transition group-hover:text-[var(--vp-accent)] sm:text-xl">
          {game.title}
        </h3>
      </div>
      <Link
        href={`/games#${game.slug}`}
        className="absolute inset-0"
        aria-label={game.title}
      />
    </article>
  );
}
