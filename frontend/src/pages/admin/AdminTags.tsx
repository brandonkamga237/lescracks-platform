import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tags } from 'lucide-react';
import { AdminConfirm, AdminModal, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { Tag } from '@/services/types';

export default function AdminTags() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<number | ''>('');
  const [pending, setPending] = useState<Tag | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => api.tags(filterCategory || undefined, signal), [filterCategory]);
  const list = (tags.data ?? []).filter((tag) => tag.name.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')));
  const field = 'mt-2 w-full rounded-2xl border border-line bg-noir-900 px-4 py-3 text-sm text-t1 focus:border-gold-400 focus:outline-none disabled:opacity-50';
  const categoriesReady = !categories.loading && !categories.error && !!categories.data?.length;

  async function act(action: string, work: () => Promise<unknown>, onSuccess: () => void) {
    if (busy) return;
    setBusy(action);
    setFailure(null);
    setNotice('');
    try { await work(); onSuccess(); tags.reload(); }
    catch (error) { setFailure(error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.'); }
    finally { setBusy(null); }
  }

  return <AdminSection title="Tags" description="Des sujets précis, rattachés à la bonne catégorie. Un même nom peut exister dans plusieurs catégories." action={<Link to="/admin/categories" className="rounded-full border border-line px-5 py-3 text-sm text-t2 hover:text-gold-400">Gérer les catégories</Link>}>
    <form onSubmit={(event) => { event.preventDefault(); if (name.trim() && categoryId) void act('create', () => adminApi.createTag(name.trim(), categoryId), () => { setName(''); setNotice('Le tag a été créé.'); }); }} className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-line-soft bg-card p-6">
      <label className="min-w-48 flex-1 text-sm text-t2">Nouveau tag<input required maxLength={60} disabled={!!busy} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. React" className={field} /></label>
      <label className="min-w-48 flex-1 text-sm text-t2">Catégorie du nouveau tag<select required disabled={!!busy || !categoriesReady} value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value) || '')} className={field}><option value="">{categories.loading ? 'Chargement…' : 'Choisir une catégorie'}</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <button type="submit" disabled={!!busy || !name.trim() || !categoryId || !categoriesReady} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden />{busy === 'create' ? 'Ajout…' : 'Ajouter'}</button>
    </form>
    {categories.error && <p role="alert" className="mb-5 text-sm text-gold-400">{categories.error.message} <button type="button" onClick={categories.reload} className="underline">Réessayer les catégories</button></p>}
    {!categories.loading && !categories.error && !categories.data?.length && <p className="mb-5 text-sm text-t3">Pour créer un tag, <Link to="/admin/categories" className="text-gold-400 underline">ajoute d’abord une catégorie</Link>.</p>}
    {failure && !editing && !pending && <p role="alert" className="mb-5 rounded-2xl border border-gold-400/40 p-4 text-sm text-t1">{failure}</p>}
    {notice && <p role="status" className="mb-5 text-sm text-gold-400">{notice}</p>}
    <div className="mb-6 grid gap-4 sm:grid-cols-2"><label className="text-xs text-t3">Rechercher un tag<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom du tag…" className={field} /></label><label className="text-xs text-t3">Filtrer par catégorie<select disabled={categories.loading || !!categories.error} value={filterCategory} onChange={(event) => setFilterCategory(Number(event.target.value) || '')} className={field}><option value="">Toutes les catégories</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
    <AdminState loading={tags.loading} error={tags.error} empty={!list.length} emptyMessage={search || filterCategory ? 'Aucun tag correspondant. Essaie une autre catégorie ou un autre nom.' : 'Aucun tag. Ajoute un premier sujet au catalogue.'} onRetry={tags.reload}>
      <p className="mb-4 text-xs text-t4">{list.length} tag{list.length !== 1 ? 's' : ''}</p>
      {list.map((tag) => <AdminRow key={tag.id}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-noir-800 text-gold-400"><Tags className="h-5 w-5" aria-hidden /></span><div className="min-w-0 flex-1"><h2 className="break-words font-display font-medium">{tag.name}</h2><p className="mt-1 text-xs text-t3">{tag.categoryName}</p></div><div className="flex gap-2" role="group" aria-label={`Actions pour ${tag.name}, ${tag.categoryName}`}><button type="button" disabled={!!busy} onClick={() => { setFailure(null); setEditName(tag.name); setEditCategory(tag.categoryId); setEditing(tag); }} className="rounded-full border border-line px-4 py-2 text-xs text-t2 hover:text-gold-400 disabled:opacity-50">Modifier</button><button type="button" disabled={!!busy} onClick={() => { setFailure(null); setPending(tag); }} className="rounded-full border border-line px-4 py-2 text-xs text-t2 hover:text-gold-400 disabled:opacity-50">Supprimer</button></div></AdminRow>)}
    </AdminState>
    <AdminModal open={!!editing} onClose={() => { setEditing(null); setFailure(null); }} title="Modifier le tag" description="Le tag garde son identité. Tu peux changer son nom ou sa catégorie." busy={!!busy}>
      <form onSubmit={(event) => { event.preventDefault(); if (editing && editName.trim() && editCategory) void act(`edit-${editing.id}`, () => adminApi.updateTag(editing.id, editName.trim(), editCategory), () => { setEditing(null); setNotice('Le tag a été modifié. S’il a changé de catégorie, retrouve-le dans sa nouvelle catégorie.'); }); }} className="space-y-5">
        <label className="block text-sm text-t2">Nom du tag<input required maxLength={60} disabled={!!busy} value={editName} onChange={(event) => setEditName(event.target.value)} className={field} /></label>
        <label className="block text-sm text-t2">Catégorie<select required disabled={!!busy || !categoriesReady} value={editCategory} onChange={(event) => setEditCategory(Number(event.target.value) || '')} className={field}><option value="">Choisir une catégorie</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        {categories.error && <p role="alert" className="text-sm text-gold-400">{categories.error.message} <button type="button" onClick={categories.reload} className="underline">Réessayer</button></p>}
        {failure && <p role="alert" className="text-sm text-gold-400">{failure}</p>}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={!!busy} onClick={() => { setEditing(null); setFailure(null); }} className="rounded-full border border-line px-5 py-3 text-sm text-t2">Annuler</button><button disabled={!!busy || !editName.trim() || !editCategory || !categoriesReady} className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
      </form>
    </AdminModal>
    <AdminConfirm open={!!pending} title="Supprimer ce tag ?" description={pending ? `« ${pending.name} » dans « ${pending.categoryName} » sera supprimé définitivement.` : ''} busy={!!busy} error={failure} onCancel={() => { setPending(null); setFailure(null); }} onConfirm={() => { if (pending) void act(`delete-${pending.id}`, () => adminApi.deleteTag(pending.id), () => { setPending(null); setNotice('Le tag a été supprimé.'); }); }} />
  </AdminSection>;
}
