'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, MessageSquare } from 'lucide-react';
import type { RoomSlug } from '@vpower777/types';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { SupportBotPanel } from '@/components/support/support-bot-panel';
import { RoomAgentChatPanel } from '@/components/support/room-agent-chat-panel';

export function SupportPanel() {
  const t = useTranslations('support');
  const router = useRouter();
  const { ready, accessToken, isAuthenticated } = useSession();
  const [mode, setMode] = useState<'assistant' | 'agent'>('agent');
  const [agentRoom, setAgentRoom] = useState<RoomSlug | undefined>();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) router.replace('/');
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated || !accessToken) {
    return null;
  }

  return (
    <div className="care-shell mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl animate-fade-up">
          <p className="care-kicker">{t('eyebrow')}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)] sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-[var(--vp-muted)] leading-relaxed">{t('subtitle')}</p>
        </div>
        <div className="flex rounded-2xl border border-[var(--vp-border)] bg-white/[0.02] p-1">
          <button
            type="button"
            className={`rounded-xl px-3.5 py-2 text-xs transition ${
              mode === 'assistant'
                ? 'bg-[rgba(46,163,242,0.2)] text-[var(--vp-accent)]'
                : 'text-[var(--vp-muted)] hover:text-[var(--vp-fg)]'
            }`}
            onClick={() => setMode('assistant')}
          >
            <span className="inline-flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              {t('tabAssistant')}
            </span>
          </button>
          <button
            type="button"
            className={`rounded-xl px-3.5 py-2 text-xs transition ${
              mode === 'agent'
                ? 'bg-[rgba(46,163,242,0.2)] text-[var(--vp-accent)]'
                : 'text-[var(--vp-muted)] hover:text-[var(--vp-fg)]'
            }`}
            onClick={() => setMode('agent')}
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {t('tabAgent')}
            </span>
          </button>
        </div>
      </div>

      <div className="support-care-shell h-[min(70vh,40rem)]">
        {mode === 'assistant' ? (
          <SupportBotPanel
            accessToken={accessToken}
            preferredLang="fr"
            onTalkToAgent={() => {
              setAgentRoom(undefined);
              setMode('agent');
            }}
          />
        ) : (
          <RoomAgentChatPanel accessToken={accessToken} initialRoom={agentRoom} />
        )}
      </div>
    </div>
  );
}
