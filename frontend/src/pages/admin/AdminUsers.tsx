import { useState } from 'react';
import { Download, Search, Trash2, Users } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { AdminUser, AuthProvider } from '@/services/types';

const statusLabels = { ACTIVE: 'Actif', INACTIVE: 'Inactif', BANNED: 'Suspendu' };
const statusStyles = {
  ACTIVE: 'border-green-500/30 bg-green-500/10 text-green-400',
  INACTIVE: 'border-t3/30 bg-t3/10 text-t3',
  BANNED: 'border-red-500/30 bg-red-500/10 text-red-400',
};
const providerLabels: Record<AuthProvider, string> = { LOCAL: 'Email', GOOGLE: 'Google', GITHUB: 'GitHub' };

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const users = useApi((signal) => adminApi.users(page, debounced, signal), [page, debounced]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(0);
    setDebounced(search.trim());
  }

  async function updateStatus(id: number, status: AdminUser['status']) {
    setBusy(id);
    setError('');
    setNotice('');
    try {
      await adminApi.updateUserStatus(id, status);
      setNotice('Statut mis à jour.');
      await users.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La mise à jour a échoué.');
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return;
    setBusy(id);
    setError('');
    setNotice('');
    try {
      await adminApi.deleteUser(id);
      setNotice('Utilisateur supprimé.');
      await users.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La suppression a échoué.');
    } finally {
      setBusy(null);
    }
  }

  const list = users.data?.content ?? [];
  const total = users.data?.totalPages ?? 1;

  return (
    <section>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-t1">Utilisateurs</h1>
          <p className="mt-1 text-sm text-t4">Gère les comptes enregistrés et leur statut.</p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t4" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par email ou nom…"
              className="w-full rounded-2xl border border-line-strong bg-background py-2.5 pl-9 pr-4 text-sm text-t1 outline-none focus:border-gold-400"
            />
          </form>
          <button type="button" onClick={() => void adminApi.exportUsers()} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-gold-400/30 bg-card px-3 py-2.5 text-sm text-gold-400 hover:bg-gold-400/10">
            <Download className="h-4 w-4" aria-hidden /> CSV
          </button>
        </div>
      </header>

      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-sm text-green-400">{notice}</p>}

      {users.loading ? (
        <p className="py-16 text-center text-t3">Chargement…</p>
      ) : users.error ? (
        <p role="alert" className="py-16 text-center text-red-400">{users.error.message}</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-line-soft bg-card py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-t4" aria-hidden />
          <p className="mt-4 text-t3">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line-soft bg-card">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line-soft bg-noir-950/50 text-t4">
              <tr>
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Connexion</th>
                <th className="px-5 py-3 font-medium">Vérifié</th>
                <th className="px-5 py-3 font-medium">Inscrit le</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((user) => (
                <tr key={user.id} className="border-b border-line-soft/50 last:border-b-0">
                  <td className="px-5 py-3 text-t1">{user.firstName} {user.lastName}</td>
                  <td className="px-5 py-3 text-t3">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.status}
                      disabled={busy === user.id}
                      onChange={(event) => void updateStatus(user.id, event.target.value as AdminUser['status'])}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none focus:border-gold-400 ${statusStyles[user.status]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-t3">{providerLabels[user.provider]}</td>
                  <td className="px-5 py-3 text-t3">{user.verified ? 'Oui' : 'Non'}</td>
                  <td className="px-5 py-3 text-t3">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy === user.id}
                      onClick={() => void remove(user.id, `${user.firstName} ${user.lastName}`.trim() || user.email)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-t3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-line-strong px-4 py-2 transition hover:border-gold-400 disabled:opacity-50"
          >
            Précédent
          </button>
          <span>Page {page + 1} / {total}</span>
          <button
            type="button"
            disabled={page >= total - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-line-strong px-4 py-2 transition hover:border-gold-400 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </section>
  );
}
