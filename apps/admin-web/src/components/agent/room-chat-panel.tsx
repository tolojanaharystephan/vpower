'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import {
  fetchAgentRooms,
  fetchConversationMessages,
  fetchConversations,
  postAgentChatMessage,
  type AgentRoom,
  type ChatConversation,
  type ChatMessage,
} from '@/lib/api';
import { getApiBaseUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function RoomChatPanel() {
  const { accessToken } = useAdminAuth();
  const [rooms, setRooms] = useState<AgentRoom[]>([]);
  const [roomSlug, setRoomSlug] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    void fetchAgentRooms(accessToken).then((r) => {
      setRooms(r);
      if (r[0]) setRoomSlug(r[0].roomSlug);
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchConversations(accessToken, roomSlug || undefined)
      .then((list) => {
        setConversations(list);
        if (list[0] && !selectedId) setSelectedId(list[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [accessToken, roomSlug]);

  useEffect(() => {
    if (!accessToken || !selectedId) {
      setMessages([]);
      return;
    }
    void fetchConversationMessages(accessToken, selectedId).then((data) => {
      setMessages(data.messages);
    });
  }, [accessToken, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!accessToken || !selectedId || (!body.trim() && !image)) return;
    setBusy(true);
    setError(null);
    try {
      await postAgentChatMessage(accessToken, selectedId, body.trim(), image);
      setBody('');
      setImage(null);
      const data = await fetchConversationMessages(accessToken, selectedId);
      setMessages(data.messages);
      setConversations(await fetchConversations(accessToken, roomSlug || undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm text-[var(--vp-muted)]">
        Salle
        <select
          className="mt-1 block rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-[var(--vp-fg)]"
          value={roomSlug}
          onChange={(e) => {
            setRoomSlug(e.target.value);
            setSelectedId(null);
          }}
        >
          <option value="">Toutes (si master)</option>
          {rooms.map((r) => (
            <option key={r.roomSlug} value={r.roomSlug}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="dash-panel max-h-[70vh] overflow-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-[var(--vp-muted)]">Aucune conversation.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`block w-full border-b border-white/5 px-3 py-3 text-left ${
                  selectedId === c.id ? 'bg-white/5' : ''
                }`}
              >
                <p className="truncate text-sm font-medium text-[var(--vp-fg)]">
                  {c.player.displayName}
                </p>
                <p className="truncate text-xs text-[var(--vp-muted)]">
                  {c.roomName} · {new Date(c.lastMessageAt).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="dash-panel flex h-[70vh] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.authorKind === 'agent'
                    ? 'ml-auto bg-[var(--vp-accent)]/20 text-[var(--vp-fg)]'
                    : 'bg-black/30 text-[var(--vp-fg)]'
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-[var(--vp-muted)]">
                  {m.authorName} · {new Date(m.createdAt).toLocaleString()}
                </p>
                {m.body ? <p className="mt-1 whitespace-pre-wrap">{m.body}</p> : null}
                {m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(m.imageUrl) ?? undefined}
                    alt="Pièce jointe"
                    className="mt-2 max-h-48 rounded-md border border-[var(--vp-border)]"
                  />
                ) : null}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[var(--vp-border)] p-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-w-[12rem] flex-1 rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
              placeholder="Répondre…"
              disabled={!selectedId}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-xs text-[var(--vp-muted)]"
              disabled={!selectedId}
            />
            <Button disabled={busy || !selectedId} onClick={() => void send()}>
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
