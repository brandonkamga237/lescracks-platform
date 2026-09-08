import { useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';

import { AdminConfirm, AdminModal, AdminPagination, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
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

function fullName(user: AdminUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
}

function UserDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, loading, error } = useApi((signal) => adminApi.user(id, signal), [id]);

  return (
    <AdminModal open onClose={onClose} title="Fiche utilisateur" description="Détails du compte" busy={loading}>
      {loading ? <p className="py-8 text-center text-t3">Chargement…</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-sm text-t1">{error.message}</p> : null}
      {data && (
        <dl className="mt-2 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-t4">Nom</dt>
            <dd className="mt-1 text-sm font-medium text-t1">{fullName(data)}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Email</dt>
            <dd className="mt-1 text-sm text-t1">{data.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Statut</dt>
            <dd className="mt-1 text-sm text-t1">{statusLabels[data.status]}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Connexion</dt>
            <dd className="mt-1 text-sm text-t1">{providerLabels[data.provider]}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Email vérifié</dt>
            <dd className="mt-1 text-sm text-t1">{data.verified ? 'Oui' : 'Non'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Inscrit le</dt>
            <dd className="mt-1 text-sm text-t1">{new Date(data.createdAt).toLocaleDateString('fr-FR')}</dd>
          </div>
        </dl>
      )}
    </AdminModal>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const users = useApi((signal) => adminApi.users(page, debounced, signal), [page, debounced]);
  const list = users.data?.content ?? [];
  const totalPages = users.data?.totalPages ?? 1;
  const totalElements = users.data?.totalElements ?? 0;

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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError('');
    setBusy(deleteTarget.id);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setNotice('Utilisateur supprimé.');
      setDeleteTarget(null);
      await users.reload();
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'La suppression a échoué.');
    } finally {
      setBusy(null);
    }
  }

  function askRemove(user: AdminUser) {
    setDeleteError('');
    setDeleteTarget({ id: user.id, name: fullName(user) });
  }

  const headerAction = (
    <div className="flex w-full max-w-md items-center gap-2">
      <form onSubmit={submitSearch} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t4" aria-hidden />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par email ou nom…"
          className="input w-full pl-9"
        />
      </form>
      <button
        type="button"
        onClick={() => void adminApi.exportUsers()}
        className="btn-secondary inline-flex shrink-0 items-center gap-2"
      >
        <Download className="h-4 w-4" aria-hidden /> CSV
      </button>
    </div>
  );

  return (
    <AdminSection title="Utilisateurs" description="Gère les comptes enregistrés et leur statut." action={headerAction}>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-sm text-green-400">{notice}</p>}

      <AdminState
        loading={users.loading}
        error={users.error}
        empty={!users.loading && !users.error && list.length === 0}
        emptyMessage="Aucun utilisateur trouvé."
        onRetry={users.reload}
      >
        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-3xl border border-white/[0.06] bg-card sm:block">
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
                  <td className="px-5 py-3 text-t1">{fullName(user)}</td>
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(user.id)}
                        className="text-sm text-gold-400 hover:underline"
                      >
                        Détails
                      </button>
                      <button
                        type="button"
                        disabled={busy === user.id}
                        onClick={() => askRemove(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 sm:hidden">
          {list.map((user) => (
            <AdminRow key={user.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-t1">{fullName(user)}</p>
                <p className="truncate text-xs text-t3">{user.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
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
                  <span className="text-xs text-t3">{providerLabels[user.provider]}</span>
                  <span className="text-xs text-t3">{user.verified ? 'Vérifié' : 'Non vérifié'}</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(user.id)}
                  className="text-sm text-gold-400 hover:underline"
                >
                  Détails
                </button>
                <button
                  type="button"
                  disabled={busy === user.id}
                  onClick={() => askRemove(user)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </AdminRow>
          ))}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          busy={users.loading}
          onChange={setPage}
        />
      </AdminState>

      {selected && <UserDetail id={selected} onClose={() => setSelected(null)} />}

      <AdminConfirm
        open={deleteTarget !== null}
        title="Supprimer cet utilisateur ?"
        description={`Le compte de ${deleteTarget?.name ?? ''} sera définitivement supprimé.`}
        busy={!!busy}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AdminSection>
  );
}
