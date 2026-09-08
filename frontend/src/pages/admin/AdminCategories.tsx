import { useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminConfirm, AdminModal, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { Category } from '@/services/types';

export default function AdminCategories() {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [pending, setPending] = useState<Category | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const categories = useApi((signal) => api.categories(signal), []);
  const list = (categories.data ?? []).filter((category) => category.name.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')));
  const field = 'input mt-2';

  async function act(action: string, work: () => Promise<unknown>, onSuccess: () => void) {
    if (busy) return;
    setBusy(action);
    setFailure(null);
    setNotice('');
    try { await work(); onSuccess(); categories.reload(); }
    catch (error) { setFailure(error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.'); }
    finally { setBusy(null); }
  }

  return <AdminSection title="Catégories" description="Les grands repères du catalogue. Chaque catégorie regroupe ses propres tags." action={<Link to="/admin/tags" className="rounded-full border border-line px-5 py-3 text-sm text-t2 hover:text-gold-400">Gérer les tags</Link>}>
    <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) void act('create', () => adminApi.createCategory(name.trim()), () => { setName(''); setNotice('La catégorie a été créée.'); }); }} className="mb-6 flex flex-wrap items-end gap-4 rounded-3xl border border-white/[0.06] bg-card p-6">
      <label className="min-w-48 flex-1 text-sm text-t2">Nouvelle catégorie<input required maxLength={80} value={name} disabled={!!busy} onChange={(event) => setName(event.target.value)} placeholder="Ex. Développement web" className={field} /></label>
      <button type="submit" disabled={!!busy || !name.trim()} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden />{busy === 'create' ? 'Ajout…' : 'Ajouter'}</button>
    </form>
    {failure && !editing && !pending && <p role="alert" className="mb-5 rounded-2xl border border-gold-400/40 p-4 text-sm text-t1">{failure}</p>}
    {notice && <p role="status" className="mb-5 text-sm text-gold-400">{notice}</p>}
    <label className="mb-6 block max-w-md text-xs text-t3">Rechercher une catégorie<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={field} placeholder="Nom de la catégorie…" /></label>
    <AdminState loading={categories.loading} error={categories.error} empty={!list.length} emptyMessage={search ? 'Aucune catégorie correspondante.' : 'Aucune catégorie. Ajoute le premier repère du catalogue.'} onRetry={categories.reload}>
      <p className="mb-4 text-xs text-t4">{list.length} catégorie{list.length !== 1 ? 's' : ''}</p>
      {list.map((category) => <AdminRow key={category.id}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-noir-800 text-gold-400"><FolderOpen className="h-5 w-5" aria-hidden /></span><h2 className="min-w-0 flex-1 break-words font-display font-medium">{category.name}</h2><div className="flex gap-2" role="group" aria-label={`Actions pour ${category.name}`}><button type="button" disabled={!!busy} onClick={() => { setFailure(null); setEditName(category.name); setEditing(category); }} className="rounded-full border border-line px-4 py-2 text-xs text-t2 hover:text-gold-400 disabled:opacity-50">Renommer</button><button type="button" disabled={!!busy} onClick={() => { setFailure(null); setPending(category); }} className="rounded-full border border-line px-4 py-2 text-xs text-t2 hover:text-gold-400 disabled:opacity-50">Supprimer</button></div></AdminRow>)}
    </AdminState>
    <AdminModal open={!!editing} onClose={() => { setEditing(null); setFailure(null); }} title="Renommer la catégorie" description="Le nouveau nom sera utilisé dans le catalogue et pour ses tags." busy={!!busy}>
      <form onSubmit={(event) => { event.preventDefault(); if (editing && editName.trim()) void act(`edit-${editing.id}`, () => adminApi.renameCategory(editing.id, editName.trim()), () => { setEditing(null); setNotice('La catégorie a été renommée.'); }); }} className="space-y-5">
        <label className="block text-sm text-t2">Nom de la catégorie<input required maxLength={80} disabled={!!busy} value={editName} onChange={(event) => setEditName(event.target.value)} className={field} /></label>
        {failure && <p role="alert" className="text-sm text-gold-400">{failure}</p>}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={!!busy} onClick={() => { setEditing(null); setFailure(null); }} className="rounded-full border border-line px-5 py-3 text-sm text-t2">Annuler</button><button disabled={!!busy || !editName.trim()} className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
      </form>
    </AdminModal>
    <AdminConfirm open={!!pending} title="Supprimer cette catégorie ?" description={pending ? `« ${pending.name} » sera supprimée définitivement. Les catégories contenant des tags ou encore utilisées par des ressources ne peuvent pas être supprimées.` : ''} busy={!!busy} error={failure} onCancel={() => { setPending(null); setFailure(null); }} onConfirm={() => { if (pending) void act(`delete-${pending.id}`, () => adminApi.deleteCategory(pending.id), () => { setPending(null); setNotice('La catégorie a été supprimée.'); }); }} />
  </AdminSection>;
}
