'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { enterDragonfury, enterPlus100, enterVblink, launchGame } from '@/lib/api';
import { RoomWalletLine } from '@/components/wallet/room-wallets-panel';
import { isMobilePortrait, RotateToPlay } from '@/components/games/rotate-to-play';

type LaunchState = {
  title: string;
  account: string;
  password: string;
  launchUrl: string;
  requiresManualLogin: boolean;
};

function playNs(slug: string) {
  if (slug === '100plus') return 'plus100Play';
  if (slug === 'dragonfury') return 'dragonfuryPlay';
  return 'vblinkPlay';
}

/**
 * Player flow: VPower777 session → landscape gate on phone → open the room.
 * Partner IDs stay off-screen; they are copied only if a lobby still asks to sign in.
 */
export function PlayLaunchScreen({
  slug,
  title,
  gameId,
}: {
  slug: string;
  title?: string;
  gameId?: string;
}) {
  const t = useTranslations(playNs(slug));
  const locale = useLocale();
  const { openAuth } = useAuthUi();
  const { accessToken, isAuthenticated, ready } = useSession();
  const [state, setState] = useState<LaunchState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [needRotate, setNeedRotate] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    if (!isAuthenticated || !accessToken) return;

    started.current = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const isPortalRoom =
          slug === 'vblink' || slug === '100plus' || slug === 'dragonfury';
        if (!isPortalRoom && !gameId) {
          throw new Error(t('enterError'));
        }

        const session =
          slug === 'vblink' && !gameId
            ? await enterVblink(accessToken)
            : slug === '100plus' && !gameId
              ? await enterPlus100(accessToken, locale)
              : slug === 'dragonfury' && !gameId
                ? await enterDragonfury(accessToken)
                : await launchGame(accessToken, gameId!, locale);

        setState({
          title: session.title || title || slug,
          account:
            session.vblinkAccount ||
            session.plus100Account ||
            session.dragonfuryAccount ||
            '',
          password:
            session.vblinkPassword ||
            session.plus100Password ||
            session.dragonfuryPassword ||
            '',
          launchUrl: session.launchUrl,
          requiresManualLogin: session.requiresManualLogin ?? false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('enterError'));
        started.current = false;
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, attempt, gameId, isAuthenticated, locale, ready, slug, t, title]);

  const openLobbyWindow = async () => {
    if (!state?.launchUrl) return;
    if (state.requiresManualLogin && state.account && state.password) {
      try {
        await navigator.clipboard.writeText(`${state.account}\n${state.password}`);
      } catch {
        /* ignore blocked clipboard */
      }
    }
    setNeedRotate(false);
    window.open(state.launchUrl, '_blank', 'noopener,noreferrer');
  };

  const openGame = () => {
    if (!state?.launchUrl) return;
    if (isMobilePortrait()) {
      setNeedRotate(true);
      return;
    }
    void openLobbyWindow();
  };

  if (!ready || loading) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4 py-20">
        <div className="flex items-center gap-3 text-sm text-[var(--vp-accent-bright)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('entering')}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)]">
          {t('loginTitle')}
        </h1>
        <p className="mt-3 text-sm text-[var(--vp-muted)]">{t('loginBody')}</p>
        <Button className="mt-8 min-h-12 w-full sm:w-auto" size="lg" onClick={() => openAuth('login')}>
          {t('loginCta')}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
        <Button
          className="mt-6 min-h-12 w-full sm:w-auto"
          onClick={() => {
            started.current = false;
            setError(null);
            setState(null);
            setAttempt((n) => n + 1);
          }}
        >
          {t('retry')}
        </Button>
        <Link href="/providers" className="mt-4 w-full sm:w-auto">
          <Button variant="secondary" className="min-h-12 w-full">
            {t('backProviders')}
          </Button>
        </Link>
      </div>
    );
  }

  if (state?.launchUrl) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-20">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)] sm:text-3xl">
          {t('redirectTitle')}
        </h1>
        {state.title ? (
          <p className="mt-2 text-sm text-[var(--vp-muted)]">{state.title}</p>
        ) : null}
        <RoomWalletLine />
        <p className="mt-4 text-sm leading-relaxed text-[var(--vp-muted)]">{t('unifiedBody')}</p>
        {state.requiresManualLogin ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--vp-muted)]">{t('playHint')}</p>
        ) : null}

        {needRotate ? (
          <RotateToPlay onContinue={() => void openLobbyWindow()} onDismiss={() => setNeedRotate(false)} />
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="min-h-12 flex-1" size="lg" onClick={openGame}>
            <ExternalLink className="h-4 w-4" />
            {t('playNow')}
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="min-h-12 w-full" size="lg">
              {t('backGames')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)]">
        {t('missingTitle')}
      </h1>
      <p className="mt-3 text-sm text-[var(--vp-muted)]">{t('missingBody')}</p>
      <Link href="/" className="mt-8 w-full sm:w-auto">
        <Button className="min-h-12 w-full">{t('backGames')}</Button>
      </Link>
    </div>
  );
}
