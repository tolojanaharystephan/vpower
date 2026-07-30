'use client';

import { Heart } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogGame } from '@/lib/catalog';
import { addFavorite, removeFavorite, listFavorites } from '@/lib/api';
import { useSession } from '@/components/auth/session-provider';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { usePlayGame } from '@/hooks/use-play-game';
import { cn } from '@/lib/utils';

export function GameTile({
  game,
  className,
  showFavorite = true,
}: {
  game: CatalogGame;
  className?: string;
  showFavorite?: boolean;
}) {
  const play = usePlayGame();
  const { openAuth } = useAuthUi();
  const { accessToken, isAuthenticated } = useSession();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(accessToken!),
    enabled: Boolean(isAuthenticated && accessToken && showFavorite),
  });

  const isFavorite = favoritesQuery.data?.some((f) => f.id === game.id) ?? false;

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error('auth');
      if (isFavorite) await removeFavorite(accessToken, game.id);
      else await addFavorite(accessToken, game.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

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

      {showFavorite ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-[var(--vp-muted)] transition hover:text-[var(--vp-accent)]"
          aria-label="Favorite"
          onClick={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              openAuth('login');
              return;
            }
            void toggleFavorite.mutateAsync();
          }}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-[var(--vp-accent)] text-[var(--vp-accent)]')} />
        </button>
      ) : null}

      <button
        type="button"
        className="absolute inset-0 z-[1] cursor-pointer"
        aria-label={game.title}
        onClick={() => void play(game.id, game.slug)}
      />
    </article>
  );
}
