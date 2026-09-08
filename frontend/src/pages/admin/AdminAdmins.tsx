import { useState } from 'react';
import { Eye, EyeOff, Plus, Shield, Trash2 } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';

export default function AdminAdmins() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const admins = useApi((signal) => adminApi.admins(signal), []);

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

  async function remove(id: number, name: string) {
    if (!window.confirm(`Supprimer l’admin ${name} ?`)) return;
    setError('');
    setNotice('');
    try {
      await adminApi.deleteAdmin(id);
      setNotice('Admin supprimé.');
      await admins.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La suppression a échoué.');
    }
  }

  const list = admins.data ?? [];

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-t1">Administrateurs</h1>
      <p className="mt-1 text-sm text-t4">Créer et gérer les accès au tableau de bord.</p>

      {error && <p role="alert" className="mb-5 mt-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-5 mt-5 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-sm text-green-400">{notice}</p>}

      <form onSubmit={create} className="mt-8 rounded-3xl border border-white/[0.06] bg-card p-6">
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

      <div className="mt-10 overflow-x-auto rounded-3xl border border-line-soft bg-card">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-line-soft bg-noir-950/50 text-t4">
            <tr>
              <th className="px-5 py-3 font-medium">Nom d’utilisateur</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((admin, index) => (
              <tr key={index} className="border-b border-line-soft/50 last:border-b-0">
                <td className="px-5 py-3 text-t1"><Shield className="mr-2 inline h-4 w-4 text-gold-400" aria-hidden />{admin.username}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => void remove(admin.id ?? index, admin.username)} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10" aria-label="Supprimer"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.loading && <p className="py-8 text-center text-t3">Chargement…</p>}
        {!admins.loading && list.length === 0 && <p className="py-8 text-center text-t3">Aucun administrateur.</p>}
      </div>
    </section>
  );
}
