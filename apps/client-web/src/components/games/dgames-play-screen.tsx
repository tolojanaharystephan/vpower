'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import {
  launchDgamesGame,
  listDgamesGames,
  type DgamesCatalogGame,
  type LaunchSession,
} from '@/lib/api';
import { RoomWalletLine } from '@/components/wallet/room-wallets-panel';

function isCloseMessage(data: unknown): boolean {
  if (typeof data === 'string') {
    return (
      data === 'closeGame' ||
      data === 'close' ||
      data === 'notifyCloseContainer' ||
      data.includes('GAME_MODE:LOBBY')
    );
  }
  if (data && typeof data === 'object' && 'closeGame' in data) return true;
  return false;
}

export function DgamesPlayScreen() {
  const t = useTranslations('dgamesPlay');
  const locale = useLocale();
  const { openAuth } = useAuthUi();
  const { accessToken, isAuthenticated, ready } = useSession();
  const [games, setGames] = useState<DgamesCatalogGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [session, setSession] = useState<LaunchSession | null>(null);

  useEffect(() => {
    if (!ready || !isAuthenticated || !accessToken) return;
    setLoading(true);
    setError(null);
    void listDgamesGames(accessToken)
      .then(setGames)
      .catch((e) => setError(e instanceof Error ? e.message : t('enterError')))
      .finally(() => setLoading(false));
  }, [ready, isAuthenticated, accessToken, t]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (isCloseMessage(event.data)) setSession(null);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const launch = async (gameId: string) => {
    if (!accessToken) return;
    setLaunchingId(gameId);
    setError(null);
    try {
      const launched = await launchDgamesGame(accessToken, gameId, locale);
      setSession(launched);
      if (launched.withoutFrame && launched.launchUrl) {
        window.open(launched.launchUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('enterError'));
    } finally {
      setLaunchingId(null);
    }
  };

  if (!ready) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--vp-accent)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)]">
          {t('loginTitle')}
        </h1>
        <p className="mt-3 text-[var(--vp-muted)]">{t('loginBody')}</p>
        <Button className="mt-6" onClick={() => openAuth('login')}>
          {t('loginCta')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--vp-accent)]">
            DGames
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)]">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--vp-muted)]">{t('body')}</p>
        </div>
        <RoomWalletLine roomSlug="dgames" />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {session && !session.withoutFrame && session.launchUrl ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-black/40">
          <div className="flex items-center justify-between border-b border-[var(--vp-border)] px-3 py-2">
            <p className="truncate text-sm text-[var(--vp-fg)]">{session.title}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  window.open(session.launchUrl, '_blank', 'noopener,noreferrer')
                }
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                {t('openExternal')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSession(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <iframe
            title={session.title}
            src={session.launchUrl}
            className="h-[min(70vh,40rem)] w-full bg-black"
            allow="fullscreen; autoplay; payment"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="grid min-h-[12rem] place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--vp-accent)]" />
        </div>
      ) : games.length === 0 ? (
        <p className="text-sm text-[var(--vp-muted)]">{t('empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <button
              key={`${game.provider}-${game.id}`}
              type="button"
              onClick={() => void launch(game.id)}
              disabled={launchingId === game.id}
              className="group overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-white/[0.03] text-left transition hover:border-[var(--vp-accent)]/50"
            >
              <div
                className="aspect-[288/210] bg-cover bg-center bg-black/40"
                style={
                  game.img
                    ? { backgroundImage: `url(${game.img})` }
                    : undefined
                }
              />
              <div className="px-3 py-3">
                <p className="truncate text-sm font-medium text-[var(--vp-fg)]">{game.name}</p>
                <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">
                  {game.provider}
                  {launchingId === game.id ? ` · ${t('entering')}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/" className="text-sm text-[var(--vp-accent)] hover:underline">
          {t('backProviders')}
        </Link>
      </div>
    </div>
  );
}
