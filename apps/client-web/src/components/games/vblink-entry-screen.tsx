'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  clearVblinkLaunchPayload,
  readVblinkLaunchPayload,
  type VblinkLaunchPayload,
} from '@/hooks/use-play-game';

export function VblinkEntryScreen() {
  const t = useTranslations('vblinkPlay');
  const [payload, setPayload] = useState<VblinkLaunchPayload | null>(null);
  const [copied, setCopied] = useState<'account' | 'password' | null>(null);

  useEffect(() => {
    setPayload(readVblinkLaunchPayload());
  }, []);

  const copy = async (kind: 'account' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--vp-fg)]">
          {t('missingTitle')}
        </h1>
        <p className="mt-3 text-sm text-[var(--vp-muted)]">{t('missingBody')}</p>
        <Link href="/games?provider=vblink" className="mt-8">
          <Button>{t('backGames')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vp-accent)]">
        VBlink
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--vp-fg)]">
        {payload.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--vp-muted)]">{t('body')}</p>

      <div className="cinema-panel mt-8 space-y-4 p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
            {t('account')}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-black/35 px-3 py-2 text-sm text-[var(--vp-fg)]">
              {payload.account}
            </code>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void copy('account', payload.account)}
            >
              {copied === 'account' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
            {t('password')}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-black/35 px-3 py-2 text-sm text-[var(--vp-fg)]">
              {payload.password}
            </code>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void copy('password', payload.password)}
            >
              {copied === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href={payload.lobbyUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button className="w-full" size="lg">
            <ExternalLink className="h-4 w-4" />
            {t('openLobby')}
          </Button>
        </a>
        <Link href="/games?provider=vblink" className="flex-1">
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={() => clearVblinkLaunchPayload()}
          >
            {t('backGames')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
