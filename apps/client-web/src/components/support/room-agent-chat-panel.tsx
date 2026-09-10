'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ROOM_NAMES, ROOM_SLUGS, type RoomSlug } from '@vpower777/types';
import {
  fetchRoomConversation,
  postRoomChatMessage,
  type RoomChatMessage,
} from '@/lib/api';
import { getApiBaseUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function RoomAgentChatPanel({
  accessToken,
  initialRoom,
}: {
  accessToken: string;
  initialRoom?: RoomSlug;
}) {
  const t = useTranslations('roomChat');
  const [roomSlug, setRoomSlug] = useState<RoomSlug>(initialRoom ?? ROOM_SLUGS[0]);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async (slug: RoomSlug) => {
    const data = await fetchRoomConversation(accessToken, slug);
    setMessages(data.messages);
  };

  useEffect(() => {
    if (initialRoom) setRoomSlug(initialRoom);
  }, [initialRoom]);

  useEffect(() => {
    void load(roomSlug).catch((e) =>
      setError(e instanceof Error ? e.message : 'Error'),
    );
    const id = setInterval(() => {
      void load(roomSlug).catch(() => undefined);
    }, 8000);
    return () => clearInterval(id);
  }, [accessToken, roomSlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!body.trim() && !image) return;
    setBusy(true);
    setError(null);
    try {
      await postRoomChatMessage(accessToken, roomSlug, body.trim(), image);
      setBody('');
      setImage(null);
      await load(roomSlug);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--vp-border)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--vp-fg)]">{t('title')}</p>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {ROOM_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setRoomSlug(slug)}
              className={`rounded-xl px-3 py-1.5 text-xs transition ${
                roomSlug === slug
                  ? 'bg-[rgba(46,163,242,0.2)] text-[var(--vp-accent)]'
                  : 'text-[var(--vp-muted)] hover:text-[var(--vp-fg)]'
              }`}
            >
              {ROOM_NAMES[slug]}
            </button>
          ))}
        </div>
      </div>

      <p className="border-b border-[var(--vp-border)] px-4 py-2 text-xs text-[var(--vp-muted)]">
        {t('hint', { room: ROOM_NAMES[roomSlug] })}
      </p>

      {error ? <p className="px-4 py-2 text-sm text-red-400">{error}</p> : null}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--vp-muted)]">{t('empty')}</p>
        ) : (
          messages.map((m) => {
            const mine = m.authorKind === 'player';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    mine
                      ? 'bg-[rgba(46,163,242,0.18)]'
                      : 'border border-[var(--vp-border)] bg-black/25'
                  }`}
                >
                  <div className="mb-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">
                    <span>{mine ? t('you') : m.authorName || t('agent')}</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  {m.body ? (
                    <p className="whitespace-pre-wrap text-sm text-[var(--vp-fg)]">{m.body}</p>
                  ) : null}
                  {m.imageUrl ? (
                    <img
                      src={mediaUrl(m.imageUrl) ?? undefined}
                      alt={t('proof')}
                      className="mt-2 max-h-52 rounded-lg border border-[var(--vp-border)]"
                    />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t border-[var(--vp-border)] p-3">
        <textarea
          className="min-h-16 w-full rounded-xl border border-[var(--vp-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--vp-accent)]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('placeholder')}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs text-[var(--vp-muted)]">
            {t('attachProof')}
            <input
              type="file"
              accept="image/*"
              className="mt-1 block text-xs"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            type="button"
            disabled={busy || (!body.trim() && !image)}
            onClick={() => void send()}
          >
            <Send className="mr-2 h-4 w-4" />
            {busy ? t('sending') : t('send')}
          </Button>
        </div>
      </div>
    </div>
  );
}
