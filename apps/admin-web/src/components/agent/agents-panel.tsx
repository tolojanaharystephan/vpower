'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import {
  createRoomAgent,
  fetchAgentAssignments,
  fetchAgentRooms,
  updateRoomAgent,
  type AgentRoom,
} from '@/lib/api';
import { Button } from '@/components/ui/button';

type AgentRow = Awaited<ReturnType<typeof fetchAgentAssignments>>[number];

export function AgentsPanel() {
  const { accessToken, isSuperAdmin } = useAdminAuth();
  const [rooms, setRooms] = useState<AgentRoom[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [editing, setEditing] = useState<AgentRow | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRooms, setEditRooms] = useState<string[]>([]);
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
    if (!accessToken || !isSuperAdmin) return;
    void reload(accessToken).catch((e) =>
      setError(e instanceof Error ? e.message : 'Erreur'),
    );
  }, [accessToken, isSuperAdmin]);

  const toggleRoom = (slug: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
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

  const saveEdit = async () => {
    if (!accessToken || !editing) return;
    if (editRooms.length === 0) {
      setError('Au moins une salle requise.');
      return;
    }
    if (editPassword && editPassword.length < 8) {
      setError('Nouveau mot de passe : 8 caractères minimum.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateRoomAgent(accessToken, editing.userId, {
        roomSlugs: editRooms,
        password: editPassword || undefined,
      });
      setEditing(null);
      setEditPassword('');
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <p className="rounded-md border border-[var(--vp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--vp-muted)]">
        Seul le compte SUPER_ADMIN (boss VPower) peut créer ou modifier les agents de salle.
      </p>
    );
  }

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
        <p className="text-xs text-[var(--vp-muted)]">
          Un agent = une salle en standard. Tu peux réassigner plus tard. Email et mot de passe
          modifiables (mot de passe ici ; nouvel email = créer un autre compte puis réassigner).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (ex. agent.vblink@…)"
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
            placeholder="Prénom / label"
            className="rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {rooms.map((r) => (
            <button
              key={r.roomSlug}
              type="button"
              onClick={() => toggleRoom(r.roomSlug, selectedRooms, setSelectedRooms)}
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
              <th />
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
                <td className="text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(a);
                      setEditRooms([...a.rooms]);
                      setEditPassword('');
                      setError(null);
                    }}
                  >
                    Modifier
                  </Button>
                </td>
              </tr>
            ))}
            {agents.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-[var(--vp-muted)]">
                  Aucun agent assigné.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="dash-panel space-y-4 p-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
            Modifier {editing.email}
          </h3>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--vp-muted)]">
              Salles
            </p>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r.roomSlug}
                  type="button"
                  onClick={() => toggleRoom(r.roomSlug, editRooms, setEditRooms)}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    editRooms.includes(r.roomSlug)
                      ? 'border-[var(--vp-accent)] bg-[var(--vp-accent)]/20 text-[var(--vp-fg)]'
                      : 'border-[var(--vp-border)] text-[var(--vp-muted)]'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <input
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Nouveau mot de passe (optionnel)"
            className="w-full rounded-md border border-[var(--vp-border)] bg-black/30 px-3 py-2 text-sm sm:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void saveEdit()}>
              Enregistrer
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setEditing(null);
                setEditPassword('');
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
