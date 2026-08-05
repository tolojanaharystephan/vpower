'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Search, Send } from 'lucide-react';
import {
  getAdminAccessToken,
  getAdminTicket,
  listAdminTickets,
  replyAdminTicket,
  replyAdminVoice,
  updateAdminTicket,
  type AdminSupportMessage,
  type AdminSupportTicket,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/api';
import { getApiBaseUrl } from '@/lib/utils';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { BrandLoader } from '@/components/brand/brand-loader';
import { connectSupportSocket } from '@/lib/support-socket';
import { VoiceRecorderButton } from '@/components/support/voice-recorder-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function browserLang() {
  if (typeof navigator === 'undefined') return 'en';
  return (navigator.language || 'en').split('-')[0] || 'en';
}

export function SupportAdminPanel() {
  const t = useTranslations('support');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { accessToken } = useAdminAuth();
  const token = accessToken ?? getAdminAccessToken() ?? '';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('ticket'));
  const [reply, setReply] = useState('');
  const [targetLang, setTargetLang] = useState(browserLang);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get('ticket');
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSupportSocket(token);
    socket.emit('prefs:set', { targetLang });
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      if (selectedId) {
        void queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] });
      }
    };
    socket.on('message:new', invalidate);
    socket.on('ticket:created', invalidate);
    socket.on('ticket:updated', invalidate);
    if (selectedId) socket.emit('ticket:join', { ticketId: selectedId });
    return () => {
      socket.disconnect();
    };
  }, [token, targetLang, selectedId, queryClient]);

  const listQuery = useQuery({
    queryKey: ['admin-support-tickets', search, status],
    queryFn: () =>
      listAdminTickets(token, {
        search: search || undefined,
        status: status || undefined,
        limit: 50,
      }),
    enabled: Boolean(token),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-support-ticket', selectedId, targetLang],
    queryFn: () => getAdminTicket(token, selectedId!, targetLang),
    enabled: Boolean(token && selectedId),
  });

  const replyMutation = useMutation({
    mutationFn: () => replyAdminTicket(token, selectedId!, reply.trim(), targetLang),
    onSuccess: async () => {
      setReply('');
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const voiceMutation = useMutation({
    mutationFn: (blob: Blob) => replyAdminVoice(token, selectedId!, blob, targetLang),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { status?: TicketStatus; priority?: TicketPriority }) =>
      updateAdminTicket(token, selectedId!, payload),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const tickets = listQuery.data?.data ?? [];
  const ticket = detailQuery.data;
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="support-workspace animate-fade-up">
      <aside className="support-queue">
        <div className="space-y-2 border-b border-[var(--vp-border)] p-3">
          <p className="admin-eyebrow">{t('inboxEyebrow')}</p>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--vp-muted)]" />
            <Input
              className="h-9 pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </label>
          <select
            className="admin-select h-9 text-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus | '')}
          >
            <option value="">{t('filterAll')}</option>
            {(['open', 'pending', 'resolved', 'closed'] as TicketStatus[]).map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {listQuery.isLoading ? (
            <li className="px-3 py-10">
              <BrandLoader size="sm" label={t('loading')} className="mx-auto" />
            </li>
          ) : tickets.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-[var(--vp-muted)]">{t('empty')}</li>
          ) : (
            tickets.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className={`support-queue-item ${
                    selectedId === row.id ? 'support-queue-item-active' : ''
                  }`}
                  onClick={() => setSelectedId(row.id)}
                >
                  <p className="truncate text-sm font-medium text-[var(--vp-fg)]">{row.subject}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--vp-muted)]">
                    {row.user?.email}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`status-pill ${
                        row.status === 'open'
                          ? 'status-pill-on'
                          : row.status === 'pending'
                            ? 'status-pill-warn'
                            : 'status-pill-off'
                      }`}
                    >
                      {t(`status.${row.status}`)}
                    </span>
                    <span className="text-[10px] text-[var(--vp-muted)]">
                      {new Date(row.updatedAt).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="support-chat-pane">
        {!ticket ? (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <p className="admin-eyebrow">{t('detailEyebrow')}</p>
              <p className="mt-2 text-sm text-[var(--vp-muted)]">{t('selectTicket')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--vp-border)] px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                  {ticket.subject}
                </h2>
                <p className="text-xs text-[var(--vp-muted)]">{ticket.user?.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="admin-select h-9 w-auto min-w-[7.5rem] text-xs"
                  value={ticket.status}
                  disabled={updateMutation.isPending}
                  onChange={(e) => updateMutation.mutate({ status: e.target.value as TicketStatus })}
                >
                  {(['open', 'pending', 'resolved', 'closed'] as TicketStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
                <select
                  className="admin-select h-9 w-auto min-w-[7rem] text-xs"
                  value={ticket.priority}
                  disabled={updateMutation.isPending}
                  onChange={(e) =>
                    updateMutation.mutate({ priority: e.target.value as TicketPriority })
                  }
                >
                  {(['low', 'normal', 'high'] as TicketPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {t(`priority.${p}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {(ticket.messages ?? []).map((msg) => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  showOriginal={showOriginal}
                  dateLocale={dateLocale}
                  t={t}
                />
              ))}
            </div>

            {error ? <p className="px-4 text-sm text-red-400">{error}</p> : null}

            {ticket.status !== 'closed' ? (
              <form
                className="border-t border-[var(--vp-border)] bg-black/20 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  replyMutation.mutate();
                }}
              >
                <textarea
                  className="admin-textarea"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('replyPlaceholder')}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <VoiceRecorderButton
                    disabled={voiceMutation.isPending}
                    onRecorded={(blob) => voiceMutation.mutate(blob)}
                    recordingLabel={t('recordVoice')}
                    stopLabel={t('stopVoice')}
                  />
                  <Button type="submit" disabled={replyMutation.isPending || !reply.trim()}>
                    <Send className="h-4 w-4" />
                    {replyMutation.isPending ? t('sending') : t('sendReply')}
                  </Button>
                </div>
              </form>
            ) : null}
          </>
        )}
      </section>

      <aside className="support-meta">
        <p className="admin-eyebrow">{t('detailEyebrow')}</p>
        {ticket ? (
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">{t('colUser')}</p>
              <p className="mt-1 text-[var(--vp-fg)]">{ticket.user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">{t('preferredLang')}</p>
              <p className="mt-1 text-[var(--vp-fg)]">{ticket.preferredLang || '—'}</p>
            </div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">
              {t('displayLang')}
              <Input
                className="mt-1 h-9"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value.trim() || browserLang())}
                placeholder="en, fr, es, mg…"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--vp-muted)]">
              <input
                type="checkbox"
                checked={showOriginal}
                onChange={(e) => setShowOriginal(e.target.checked)}
              />
              {t('showOriginal')}
            </label>
          </div>
        ) : (
          <p className="mt-4 text-xs text-[var(--vp-muted)]">{t('selectTicket')}</p>
        )}
      </aside>
    </div>
  );
}

function ChatBubble({
  msg,
  showOriginal,
  dateLocale,
  t,
}: {
  msg: AdminSupportMessage;
  showOriginal: boolean;
  dateLocale: string;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const staff = msg.authorType === 'staff';
  const bot = msg.authorType === 'bot';
  const display =
    !showOriginal && msg.translatedBody ? msg.translatedBody : msg.body;
  const audio =
    msg.audioUrl &&
    (msg.audioUrl.startsWith('http')
      ? msg.audioUrl
      : `${getApiBaseUrl()}${msg.audioUrl.startsWith('/') ? '' : '/'}${msg.audioUrl}`);
  return (
    <div className={`flex ${staff ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`chat-bubble ${
          bot ? 'chat-bubble-bot' : staff ? 'chat-bubble-staff' : 'chat-bubble-user'
        }`}
      >
        <div className="mb-1 flex gap-2 text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">
          <span>{bot ? t('authorBot') : staff ? t('authorStaff') : t('authorUser')}</span>
          <span>{new Date(msg.createdAt).toLocaleString(dateLocale)}</span>
        </div>
        {msg.kind === 'voice' && audio ? (
          <audio controls src={audio} className="max-w-full" />
        ) : null}
        {msg.body && !(msg.kind === 'voice' && msg.body === '[Voice message]') ? (
          <p className="mt-1 whitespace-pre-wrap text-sm">{display}</p>
        ) : msg.kind !== 'voice' ? (
          <p className="whitespace-pre-wrap text-sm">{display}</p>
        ) : null}
        {msg.translatedBody && msg.sourceLang ? (
          <p className="mt-1 text-[10px] text-[var(--vp-muted)]">
            {showOriginal
              ? t('showingOriginal')
              : t('translatedFrom', { lang: msg.sourceLang })}
          </p>
        ) : msg.sourceLang ? (
          <p className="mt-1 text-[10px] text-[var(--vp-muted)]">
            {t('detectedLang', { lang: msg.sourceLang })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
