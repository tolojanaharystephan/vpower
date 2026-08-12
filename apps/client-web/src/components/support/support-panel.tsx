'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Bot, MessageSquarePlus, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { BrandLoader } from '@/components/brand/brand-loader';
import {
  addTicketMessage,
  addTicketVoice,
  createTicket,
  getMyTicket,
  listMyTickets,
  type SupportMessage,
  type TicketStatus,
} from '@/lib/api';
import { getApiBaseUrl } from '@/lib/utils';
import { connectSupportSocket } from '@/lib/support-socket';
import { SupportBotPanel } from '@/components/support/support-bot-panel';
import { VoiceRecorderButton } from '@/components/support/voice-recorder-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function browserLang() {
  if (typeof navigator === 'undefined') return 'en';
  return (navigator.language || 'en').split('-')[0] || 'en';
}

function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function SupportPanel() {
  const t = useTranslations('support');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ready, accessToken, isAuthenticated } = useSession();

  const [mode, setMode] = useState<'tickets' | 'assistant'>('assistant');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [targetLang, setTargetLang] = useState(browserLang);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) router.replace('/');
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSupportSocket(accessToken);
    socket.emit('prefs:set', { targetLang });
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      if (selectedId) {
        void queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedId] });
      }
    };
    socket.on('message:new', invalidate);
    socket.on('ticket:updated', invalidate);
    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    if (selectedId) socket.emit('ticket:join', { ticketId: selectedId });
    return () => {
      socket.disconnect();
    };
  }, [accessToken, targetLang, selectedId, queryClient]);

  const listQuery = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => listMyTickets(accessToken!),
    enabled: Boolean(ready && isAuthenticated && accessToken),
  });

  const detailQuery = useQuery({
    queryKey: ['support-ticket', selectedId, targetLang],
    queryFn: () => getMyTicket(accessToken!, selectedId!, targetLang),
    enabled: Boolean(ready && isAuthenticated && accessToken && selectedId && mode === 'tickets'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTicket(accessToken!, {
        subject: subject.trim(),
        body: body.trim(),
        preferredLang: targetLang,
      }),
    onSuccess: async (ticket) => {
      setCreating(false);
      setSubject('');
      setBody('');
      setError(null);
      setSelectedId(ticket.id);
      setMode('tickets');
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const replyMutation = useMutation({
    mutationFn: () => addTicketMessage(accessToken!, selectedId!, reply.trim(), targetLang),
    onSuccess: async () => {
      setReply('');
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedId] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const voiceMutation = useMutation({
    mutationFn: (blob: Blob) =>
      addTicketVoice(accessToken!, selectedId!, blob, { targetLang }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedId] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!ready || !isAuthenticated || !accessToken) {
    return (
      <div className="mx-auto grid max-w-5xl place-items-center px-4 py-24">
        <BrandLoader size="md" label={t('loading')} />
      </div>
    );
  }

  const tickets = listQuery.data?.data ?? [];
  const ticket = detailQuery.data;
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

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
        <div className="flex flex-wrap items-center gap-2">
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
                mode === 'tickets'
                  ? 'bg-[rgba(46,163,242,0.2)] text-[var(--vp-accent)]'
                  : 'text-[var(--vp-muted)] hover:text-[var(--vp-fg)]'
              }`}
              onClick={() => setMode('tickets')}
            >
              {t('tabTickets')}
            </button>
          </div>
          {mode === 'tickets' ? (
            <>
              <Input
                className="h-9 w-28"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value.trim() || browserLang())}
                placeholder={t('displayLang')}
              />
              <Button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setSelectedId(null);
                  setError(null);
                }}
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                {t('newTicket')}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      {mode === 'assistant' ? (
        <div className="support-care-shell h-[min(70vh,40rem)]">
          <SupportBotPanel
            accessToken={accessToken}
            preferredLang={targetLang}
            onEscalated={(id) => {
              setMode('tickets');
              setSelectedId(id);
              setCreating(false);
            }}
          />
        </div>
      ) : (
        <div className="support-care-shell flex h-[min(70vh,40rem)]">
          <aside className="flex w-full max-w-[15rem] flex-col border-r border-[var(--vp-border)] sm:max-w-[17rem]">
            <ul className="flex-1 overflow-y-auto">
              {listQuery.isLoading ? (
                <li className="px-3 py-10">
                  <BrandLoader size="sm" label={t('loading')} className="mx-auto" />
                </li>
              ) : tickets.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-[var(--vp-muted)]">{t('empty')}</li>
              ) : (
                tickets.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`w-full border-b border-[var(--vp-border)] px-3 py-3 text-left transition hover:bg-white/[0.03] ${
                        selectedId === item.id ? 'bg-[rgba(46,163,242,0.08)]' : ''
                      }`}
                      onClick={() => {
                        setCreating(false);
                        setSelectedId(item.id);
                      }}
                    >
                      <p className="truncate text-sm font-medium">{item.subject}</p>
                      <div className="mt-1 flex justify-between gap-2 text-[10px] text-[var(--vp-muted)]">
                        <span className="uppercase text-[var(--vp-accent)]">
                          {t(`status.${item.status}`)}
                        </span>
                        <span>{new Date(item.updatedAt).toLocaleDateString(dateLocale)}</span>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            {creating ? (
              <form
                className="flex flex-1 flex-col gap-3 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!subject.trim() || !body.trim()) return;
                  createMutation.mutate();
                }}
              >
                <h2 className="font-[family-name:var(--font-display)] text-xl">{t('createTitle')}</h2>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('subject')}
                  maxLength={200}
                />
                <textarea
                  className="min-h-40 flex-1 rounded-xl border border-[var(--vp-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--vp-accent)]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t('message')}
                />
                <Button type="submit" disabled={createMutation.isPending || !subject.trim() || !body.trim()}>
                  {createMutation.isPending ? t('sending') : t('submit')}
                </Button>
              </form>
            ) : ticket ? (
              <>
                <div className="border-b border-[var(--vp-border)] px-4 py-3">
                  <h2 className="font-[family-name:var(--font-display)] text-lg">{ticket.subject}</h2>
                  <p className="text-xs text-[var(--vp-muted)]">
                    {t(`status.${ticket.status as TicketStatus}`)}
                  </p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {(ticket.messages ?? []).map((msg) => (
                    <Bubble
                      key={msg.id}
                      msg={msg}
                      showOriginal={showOriginal}
                      dateLocale={dateLocale}
                      t={t}
                    />
                  ))}
                </div>
                {ticket.status === 'closed' || ticket.status === 'resolved' ? (
                  <p className="border-t border-[var(--vp-border)] px-4 py-3 text-sm text-[var(--vp-muted)]">
                    {t('closedHint')}
                  </p>
                ) : (
                  <form
                    className="border-t border-[var(--vp-border)] p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!reply.trim()) return;
                      replyMutation.mutate();
                    }}
                  >
                    <textarea
                      className="min-h-16 w-full rounded-xl border border-[var(--vp-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--vp-accent)]"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={t('replyPlaceholder')}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <VoiceRecorderButton
                          disabled={voiceMutation.isPending}
                          onRecorded={(blob) => voiceMutation.mutate(blob)}
                          recordingLabel={t('recordVoice')}
                          stopLabel={t('stopVoice')}
                        />
                        <label className="flex items-center gap-1.5 text-xs text-[var(--vp-muted)]">
                          <input
                            type="checkbox"
                            checked={showOriginal}
                            onChange={(e) => setShowOriginal(e.target.checked)}
                          />
                          {t('showOriginal')}
                        </label>
                      </div>
                      <Button type="submit" disabled={replyMutation.isPending || !reply.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        {replyMutation.isPending ? t('sending') : t('send')}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="grid flex-1 place-items-center px-6 text-center text-sm text-[var(--vp-muted)]">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                    {t('selectTicket')}
                  </p>
                  <p className="mt-2 max-w-xs text-[var(--vp-muted)]">{t('selectTicketHint')}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Bubble({
  msg,
  showOriginal,
  dateLocale,
  t,
}: {
  msg: SupportMessage;
  showOriginal: boolean;
  dateLocale: string;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const mine = msg.authorType === 'user';
  const display = !showOriginal && msg.translatedBody ? msg.translatedBody : msg.body;
  const audio = mediaUrl(msg.audioUrl);
  const authorLabel =
    msg.authorType === 'bot'
      ? t('authorBot')
      : mine
        ? t('authorYou')
        : t('authorStaff');

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          msg.authorType === 'bot'
            ? 'border border-[rgba(46,163,242,0.25)] bg-[rgba(46,163,242,0.06)]'
            : mine
              ? 'bg-[rgba(46,163,242,0.18)]'
              : 'border border-[var(--vp-border)] bg-black/25'
        }`}
      >
        <div className="mb-1 flex gap-2 text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">
          <span>{authorLabel}</span>
          <span>{new Date(msg.createdAt).toLocaleString(dateLocale)}</span>
        </div>
        {msg.kind === 'voice' && audio ? (
          <audio controls src={audio} className="mt-1 max-w-full" />
        ) : null}
        {msg.body && msg.body !== '[Voice message]' ? (
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--vp-fg)]">{display}</p>
        ) : msg.kind !== 'voice' ? (
          <p className="whitespace-pre-wrap text-sm text-[var(--vp-fg)]">{display}</p>
        ) : null}
      </div>
    </div>
  );
}
