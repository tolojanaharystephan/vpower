'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  createGame,
  deleteGame,
  getAdminAccessToken,
  listCategories,
  listGames,
  listProviders,
  updateGame,
  type AdminGame,
  type GamePayload,
  type GameStatus,
} from '@/lib/api';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { GameForm } from '@/components/games/game-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function GamesAdminPanel() {
  const t = useTranslations('games');
  const { accessToken } = useAdminAuth();
  const token = accessToken ?? getAdminAccessToken() ?? '';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<GameStatus | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gamesQuery = useQuery({
    queryKey: ['admin-games', search, status],
    queryFn: () =>
      listGames(token, {
        search: search || undefined,
        status: status || undefined,
        limit: 50,
      }),
    enabled: Boolean(token),
  });

  const providersQuery = useQuery({
    queryKey: ['admin-game-providers'],
    queryFn: () => listProviders(token),
    enabled: Boolean(token),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-game-categories'],
    queryFn: () => listCategories(token),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: GamePayload) => {
      if (editing) return updateGame(token, editing.id, payload);
      return createGame(token, payload);
    },
    onSuccess: async () => {
      setFormOpen(false);
      setEditing(null);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-games'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGame(token, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-games'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const games = gamesQuery.data?.data ?? [];
  const total = gamesQuery.data?.total ?? 0;
  const providers = providersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const ready = useMemo(
    () => providers.length > 0 && categories.length > 0,
    [providers.length, categories.length],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
            {t('catalogEyebrow')}
          </p>
          <p className="mt-1 text-sm text-[var(--vp-muted)]">{t('catalogSubtitle', { count: total })}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
            setError(null);
          }}
          disabled={!ready}
        >
          <Plus className="h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-muted)]" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <select
          className="h-10 rounded-md border border-[var(--vp-border)] bg-[var(--vp-surface)] px-3 text-sm text-[var(--vp-fg)] outline-none focus:border-[var(--vp-accent)]"
          value={status}
          onChange={(e) => setStatus(e.target.value as GameStatus | '')}
        >
          <option value="">{t('statusAll')}</option>
          {(['draft', 'active', 'inactive', 'archived'] as GameStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {gamesQuery.isError ? <p className="text-sm text-red-400">{t('loadError')}</p> : null}

      <div className="dash-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--vp-border)] text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('colTitle')}</th>
                <th className="px-4 py-3 font-semibold">{t('colProvider')}</th>
                <th className="px-4 py-3 font-semibold">{t('colCategory')}</th>
                <th className="px-4 py-3 font-semibold">{t('colStatus')}</th>
                <th className="px-4 py-3 font-semibold">{t('colFlags')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {gamesQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--vp-muted)]">
                    {t('loading')}
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--vp-muted)]">
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                games.map((game) => (
                  <tr key={game.id} className="border-b border-[var(--vp-border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-8 shrink-0 rounded-lg border border-[var(--vp-border)]"
                          style={{ background: game.accent ?? 'rgba(212,160,23,0.2)' }}
                        />
                        <div>
                          <p className="font-medium text-[var(--vp-fg)]">{game.title}</p>
                          <p className="text-xs text-[var(--vp-muted)]">{game.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--vp-muted)]">{game.provider.name}</td>
                    <td className="px-4 py-3 text-[var(--vp-muted)]">{game.category.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--vp-fg)]">
                        {t(`status.${game.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--vp-muted)]">
                      {[
                        game.isFeatured ? t('flagFeatured') : null,
                        game.isNew ? t('flagNew') : null,
                        game.isPopular ? t('flagPopular') : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(game);
                            setFormOpen(true);
                            setError(null);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-300 hover:text-red-200"
                          onClick={() => {
                            if (window.confirm(t('deleteConfirm', { title: game.title }))) {
                              void deleteMutation.mutateAsync(game.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GameForm
        open={formOpen}
        game={editing}
        providers={providers}
        categories={categories}
        saving={saveMutation.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
