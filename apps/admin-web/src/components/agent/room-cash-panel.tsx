'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import {
  fetchAgentRooms,
  fetchRoomStats,
  fetchRoomTransactions,
  type AgentRoom,
  type RoomStats,
} from '@/lib/api';

export function RoomCashPanel() {
  const { accessToken } = useAdminAuth();
  const [rooms, setRooms] = useState<AgentRoom[]>([]);
  const [roomSlug, setRoomSlug] = useState('');
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [txs, setTxs] = useState<
    Awaited<ReturnType<typeof fetchRoomTransactions>>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void fetchAgentRooms(accessToken).then((r) => {
      setRooms(r);
      if (r[0]) setRoomSlug(r[0].roomSlug);
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !roomSlug) return;
    void Promise.all([
      fetchRoomStats(accessToken, roomSlug),
      fetchRoomTransactions(accessToken, roomSlug),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTxs(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [accessToken, roomSlug]);

  return (
    <div className="space-y-5">
      <label className="text-sm text-[var(--vp-muted)]">
        Salle
        <select
          className="mt-1 block rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-[var(--vp-fg)]"
          value={roomSlug}
          onChange={(e) => setRoomSlug(e.target.value)}
        >
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

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CashCard label="Recettes" value={`$${stats.deposits}`} />
          <CashCard label="Retraits" value={`$${stats.withdrawals}`} />
          <CashCard label="Net" value={`$${stats.net}`} accent />
          <CashCard label="Soldes wallets" value={`$${stats.walletsBalance}`} />
        </div>
      ) : null}

      <div className="dash-panel overflow-hidden">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Joueur</th>
              <th>Type</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>
                  <div>{tx.playerName}</div>
                  <div className="text-xs text-[var(--vp-muted)]">{tx.email}</div>
                </td>
                <td>{tx.kind}</td>
                <td>${tx.amount}</td>
              </tr>
            ))}
            {txs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-[var(--vp-muted)]">
                  Aucune opération.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="dash-panel p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
        {label}
      </p>
      <p
        className={
          accent
            ? 'mt-2 text-2xl text-[var(--vp-accent-bright)]'
            : 'mt-2 text-2xl text-[var(--vp-fg)]'
        }
      >
        {value}
      </p>
    </div>
  );
}
