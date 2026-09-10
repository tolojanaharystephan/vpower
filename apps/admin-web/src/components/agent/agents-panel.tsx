'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import {
  createRoomAgent,
  fetchAgentAssignments,
  fetchAgentRooms,
  type AgentRoom,
} from '@/lib/api';
import { Button } from '@/components/ui/button';

export function AgentsPanel() {
  const { accessToken } = useAdminAuth();
  const [rooms, setRooms] = useState<AgentRoom[]>([]);
  const [agents, setAgents] = useState<
    Awaited<ReturnType<typeof fetchAgentAssignments>>
  >([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async (token: string) => {
    const [r, a] = await Promise.all([
      fetchAgentRooms(token),
      fetchAgentAssignments(token),
    ]);
    setRooms(r);
    setAgents(a);
  };

  useEffect(() => {
    if (!accessToken) return;
    void reload(accessToken).catch((e) =>
      setError(e instanceof Error ? e.message : 'Erreur'),
    );
  }, [accessToken]);

  const toggleRoom = (slug: string) => {
    setSelectedRooms((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const create = async () => {
    if (!accessToken || !email || password.length < 8 || selectedRooms.length === 0) {
      setError('Email, mot de passe (≥8) et au moins une salle requis.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createRoomAgent(accessToken, {
        email,
        password,
        firstName: firstName || undefined,
        roomSlugs: selectedRooms,
      });
      setEmail('');
      setPassword('');
      setFirstName('');
      setSelectedRooms([]);
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="dash-panel space-y-4 p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
          Nouvel agent
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            className="rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {rooms.map((r) => (
            <button
              key={r.roomSlug}
              type="button"
              onClick={() => toggleRoom(r.roomSlug)}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                selectedRooms.includes(r.roomSlug)
                  ? 'border-[var(--vp-accent)] bg-[var(--vp-accent)]/20 text-[var(--vp-fg)]'
                  : 'border-[var(--vp-border)] text-[var(--vp-muted)]'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <Button disabled={busy} onClick={() => void create()}>
          Créer / assigner
        </Button>
      </div>

      <div className="dash-panel overflow-hidden">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Salles</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.userId}>
                <td>
                  <div className="font-medium">{a.displayName}</div>
                  <div className="text-xs text-[var(--vp-muted)]">{a.email}</div>
                </td>
                <td>{a.rooms.join(', ') || '—'}</td>
              </tr>
            ))}
            {agents.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-[var(--vp-muted)]">
                  Aucun agent assigné.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
