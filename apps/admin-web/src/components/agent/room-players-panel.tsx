'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import {
  creditPlayer,
  debitPlayer,
  fetchAgentRooms,
  fetchPlayerDetail,
  fetchRoomPlayers,
  type AgentPlayer,
  type AgentRoom,
} from '@/lib/api';
import { getApiBaseUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function RoomPlayersPanel() {
  const { accessToken } = useAdminAuth();
  const [rooms, setRooms] = useState<AgentRoom[]>([]);
  const [roomSlug, setRoomSlug] = useState('');
  const [players, setPlayers] = useState<AgentPlayer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchPlayerDetail>> | null>(
    null,
  );
  const [amount, setAmount] = useState('10');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void fetchAgentRooms(accessToken).then((r) => {
      setRooms(r);
      if (r[0]) setRoomSlug(r[0].roomSlug);
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !roomSlug) return;
    void fetchRoomPlayers(accessToken, roomSlug).then(setPlayers).catch((e) => {
      setError(e instanceof Error ? e.message : 'Erreur');
    });
  }, [accessToken, roomSlug]);

  useEffect(() => {
    if (!accessToken || !roomSlug || !selected) {
      setDetail(null);
      return;
    }
    void fetchPlayerDetail(accessToken, roomSlug, selected).then(setDetail);
  }, [accessToken, roomSlug, selected]);

  const amountCents = useMemo(() => Math.round(Number(amount || 0) * 100), [amount]);

  const adjust = async (kind: 'credit' | 'debit') => {
    if (!accessToken || !selected || !roomSlug || amountCents <= 0) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === 'credit') {
        await creditPlayer(accessToken, roomSlug, selected, amountCents, note || undefined);
      } else {
        await debitPlayer(accessToken, roomSlug, selected, amountCents, note || undefined);
      }
      const d = await fetchPlayerDetail(accessToken, roomSlug, selected);
      setDetail(d);
      setPlayers(await fetchRoomPlayers(accessToken, roomSlug));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-[var(--vp-muted)]">
          Salle
          <select
            className="mt-1 block rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-[var(--vp-fg)]"
            value={roomSlug}
            onChange={(e) => {
              setRoomSlug(e.target.value);
              setSelected(null);
            }}
          >
            {rooms.map((r) => (
              <option key={r.roomSlug} value={r.roomSlug}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="dash-panel overflow-hidden">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.id}
                  className={selected === p.id ? 'bg-white/5' : 'cursor-pointer'}
                  onClick={() => setSelected(p.id)}
                >
                  <td>
                    <div className="font-medium text-[var(--vp-fg)]">{p.displayName}</div>
                    <div className="text-xs text-[var(--vp-muted)]">{p.email}</div>
                  </td>
                  <td>${p.balance}</td>
                </tr>
              ))}
              {players.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-[var(--vp-muted)]">
                    Aucun joueur pour cette salle.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="dash-panel space-y-4 p-5">
          {!detail ? (
            <p className="text-sm text-[var(--vp-muted)]">Sélectionne un joueur.</p>
          ) : (
            <>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
                  {detail.player.displayName}
                </h3>
                <p className="text-sm text-[var(--vp-muted)]">{detail.player.email}</p>
                <p className="mt-2 text-2xl text-[var(--vp-accent-bright)]">
                  ${detail.wallet.balance}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-28 rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
                  placeholder="Montant $"
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-w-[12rem] flex-1 rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
                  placeholder="Note (preuve / référence)"
                />
                <Button disabled={busy} onClick={() => void adjust('credit')}>
                  Créditer
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => void adjust('debit')}>
                  Débiter
                </Button>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
                  Historique
                </p>
                <ul className="max-h-64 space-y-2 overflow-auto text-sm">
                  {detail.transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex justify-between gap-3 border-b border-white/5 py-2"
                    >
                      <span>
                        {tx.kind}{' '}
                        <span className="text-[var(--vp-muted)]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </span>
                      <span
                        className={
                          tx.amountCents >= 0 ? 'text-emerald-300' : 'text-amber-200'
                        }
                      >
                        {tx.amountCents >= 0 ? '+' : '-'}${tx.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="hidden text-xs text-[var(--vp-muted)]">{getApiBaseUrl()}</p>
    </div>
  );
}
