import { useState } from 'react';
import { Eye, EyeOff, Plus, Shield, Trash2 } from 'lucide-react';

import { AdminConfirm, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { AdminSummary } from '@/services/types';

export default function AdminAdmins() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletePending, setDeletePending] = useState<AdminSummary | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const admins = useApi((signal) => adminApi.admins(signal), []);
  const list = admins.data ?? [];

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (username.length < 3 || password.length < 10) {
      setError('Le nom doit faire au moins 3 caractères et le mot de passe au moins 10.');
      return;
    }
    setBusy(true);
    try {
      await adminApi.createAdmin(username, password);
      setNotice(`Admin ${username} créé.`);
      setUsername('');
      setPassword('');
      await admins.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La création a échoué.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deletePending) return;
    setDeleteError('');
    setBusy(true);
    try {
      await adminApi.deleteAdmin(deletePending.id);
      setNotice('Admin supprimé.');
      setDeletePending(null);
      await admins.reload();
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'La suppression a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminSection title="Administrateurs" description="Créer et gérer les accès au tableau de bord.">
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-sm text-green-400">{notice}</p>}

      <form onSubmit={create} className="mb-6 rounded-3xl border border-white/[0.06] bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-t1">Nouvel administrateur</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="admin-username" className="text-sm font-medium text-t2">Nom d’utilisateur</label>
            <input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} className="input mt-2" />
          </div>
          <div className="relative">
            <label htmlFor="admin-password" className="text-sm font-medium text-t2">Mot de passe</label>
            <input id="admin-password" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} className="input mt-2 pr-10" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-t4 transition hover:text-t1" aria-label={show ? 'Masquer' : 'Afficher'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-5"><Plus className="h-4 w-4" aria-hidden /> {busy ? 'Création…' : 'Créer l’admin'}</button>
      </form>

      <AdminState
        loading={admins.loading}
        error={admins.error}
        empty={!list.length}
        emptyMessage="Aucun administrateur."
        onRetry={admins.reload}
      >
        {list.map((admin) => (
          <AdminRow key={admin.id}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-noir-800 text-gold-400">
              <Shield className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words font-display font-medium text-t1">{admin.username}</p>
              <p className="text-xs text-t3">{admin.role}</p>
            </div>
            <button
              type="button"
              onClick={() => { setDeleteError(''); setDeletePending(admin); }}
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </AdminRow>
        ))}
      </AdminState>

      <AdminConfirm
        open={!!deletePending}
        title="Supprimer cet administrateur ?"
        description={deletePending ? `Le compte de ${deletePending.username} sera supprimé définitivement.` : ''}
        busy={busy}
        error={deleteError}
        onCancel={() => { setDeletePending(null); setDeleteError(''); }}
        onConfirm={confirmDelete}
      />
    </AdminSection>
  );
}
