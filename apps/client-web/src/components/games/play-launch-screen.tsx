'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Copy, Check, ExternalLink, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useAuthUi } from '@/components/auth/auth-ui-context';
import { useSession } from '@/components/auth/session-provider';
import { enterVblink, launchGame } from '@/lib/api';

type LaunchState = {
  title: string;
  account: string;
  password: string;
  launchUrl: string;
  requiresManualLogin: boolean;
};

type CopiedField = 'account' | 'password' | null;

/**
 * Player flow: click game → POST launch → ensure VBlink account →
 * show credentials + "Ouvrir le jeu" → window.open(launchUrl, '_blank').
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
  const t = useTranslations('vblinkPlay');
  const locale = useLocale();
  const { openAuth } = useAuthUi();
  const { accessToken, isAuthenticated, ready } = useSession();
  const [state, setState] = useState<LaunchState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<CopiedField>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    if (!isAuthenticated || !accessToken) return;

    started.current = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        if (slug !== 'vblink' && !gameId) {
          throw new Error(t('enterError'));
        }

        const session =
          slug === 'vblink' && !gameId
            ? await enterVblink(accessToken)
            : await launchGame(accessToken, gameId!, locale);

        setState({
          title: session.title || title || slug,
          account: session.vblinkAccount || '',
          password: session.vblinkPassword || '',
          launchUrl: session.launchUrl,
          requiresManualLogin: session.requiresManualLogin ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('enterError'));
        started.current = false;
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, attempt, gameId, isAuthenticated, locale, ready, slug, t, title]);

  const copyField = async (field: 'account' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const openGame = () => {
    if (!state?.launchUrl) return;
    window.open(state.launchUrl, '_blank', 'noopener,noreferrer');
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
        <Button className="mt-8" size="lg" onClick={() => openAuth('login')}>
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
          className="mt-6"
          onClick={() => {
            started.current = false;
            setError(null);
            setState(null);
            setAttempt((n) => n + 1);
          }}
        >
          {t('retry')}
        </Button>
        <Link href="/providers" className="mt-4">
          <Button variant="secondary">{t('backProviders')}</Button>
        </Link>
      </div>
    );
  }

  if (state?.requiresManualLogin && state.account) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-20">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)] sm:text-3xl">
          {t('redirectTitle')}
        </h1>
        {state.title ? (
          <p className="mt-2 text-sm text-[var(--vp-muted)]">{state.title}</p>
        ) : null}

        <div className="cinema-panel mt-6 space-y-4 p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
              {t('account')}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-black/35 px-3 py-2 text-sm text-[var(--vp-fg)]">
                {state.account}
              </code>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void copyField('account', state.account)}
              >
                {copied === 'account' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {t('copy')}
              </Button>
            </div>
          </div>
          {state.password ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
                {t('password')}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-black/35 px-3 py-2 text-sm text-[var(--vp-fg)]">
                  {showPassword ? state.password : '•'.repeat(Math.min(12, state.password.length))}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void copyField('password', state.password)}
                >
                  {copied === 'password' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {t('copy')}
                </Button>
              </div>
            </div>
          ) : null}
          <p className="text-xs text-[var(--vp-muted)]">{t('loginHint')}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="flex-1" size="lg" onClick={openGame}>
            <ExternalLink className="h-4 w-4" />
            {t('openGame')}
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full" size="lg">
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
      <Link href="/" className="mt-8">
        <Button>{t('backGames')}</Button>
      </Link>
    </div>
  );
}
