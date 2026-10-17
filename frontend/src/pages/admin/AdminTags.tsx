import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { AdminAction, AdminConfirm, AdminModal, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { Tag } from '@/services/types';

/** Tags are free words on articles, unique by name; the themes are managed on their own page. */
export default function AdminTags() {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [pending, setPending] = useState<Tag | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const tags = useApi((signal) => api.tags(signal), []);
  const list = (tags.data ?? []).filter((tag) => tag.name.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')));

  async function act(action: string, work: () => Promise<unknown>, onSuccess: () => void) {
    if (busy) return;
    setBusy(action);
    setFailure(null);
    setNotice('');
    try { await work(); onSuccess(); tags.reload(); }
    catch (error) { setFailure(error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.'); }
    finally { setBusy(null); }
  }

  return <AdminSection title="Tags" description="Les mots posés sur les articles. Chaque nom n’existe qu’une fois ; on peut aussi en créer depuis l’éditeur d’article." action={<Link to="/admin/categories" className="btn-secondary">Gérer les thèmes</Link>}>
    <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) void act('create', () => adminApi.createTag(name.trim()), () => { setName(''); setNotice('Le tag a été créé.'); }); }} className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-line-soft bg-card p-6">
      <label className="min-w-48 flex-1 text-sm text-t2">Nouveau tag<input required maxLength={60} disabled={!!busy} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. React" className="input mt-2" /></label>
      <button type="submit" disabled={!!busy || !name.trim()} className="btn-primary"><Plus className="h-4 w-4" aria-hidden />{busy === 'create' ? 'Ajout…' : 'Ajouter'}</button>
    </form>
    {failure && !editing && !pending && <p role="alert" className="mb-5 rounded-lg border border-gold-400/40 p-4 text-sm text-t1">{failure}</p>}
    {notice && <p role="status" className="mb-5 text-sm text-gold-ink">{notice}</p>}
    <label className="mb-6 block max-w-md text-xs text-t3">Rechercher un tag<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom du tag…" className="input mt-2" /></label>
    <AdminState loading={tags.loading} error={tags.error} empty={!list.length} emptyMessage={search ? 'Aucun tag de ce nom.' : 'Aucun tag. Ajoute le premier, ou crée-le en écrivant un article.'} onRetry={tags.reload}>
      <p className="mb-4 text-xs text-t4">{list.length} tag{list.length !== 1 ? 's' : ''}</p>
      {list.map((tag) => <AdminRow key={tag.id}>
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded bg-noir-800 text-gold-ink sm:flex"><Tags className="h-5 w-5" aria-hidden /></span>
        <h2 className="min-w-0 flex-1 break-words text-base font-semibold leading-snug tracking-normal text-t1 sm:text-lg">{tag.name}</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${tag.name}`}>
          <AdminAction icon={Pencil} label="Renommer" disabled={!!busy} onClick={() => { setEditing(tag); setEditName(tag.name); setFailure(null); }} />
          <AdminAction icon={Trash2} label="Supprimer" danger disabled={!!busy} onClick={() => { setPending(tag); setFailure(null); }} />
        </div>
      </AdminRow>)}
    </AdminState>
    <AdminModal open={!!editing} onClose={() => { setEditing(null); setFailure(null); }} title="Renommer le tag" description="Les articles qui portent ce tag le gardent, sous son nouveau nom." busy={!!busy}>
      <form onSubmit={(event) => { event.preventDefault(); if (editing && editName.trim()) void act(`edit-${editing.id}`, () => adminApi.renameTag(editing.id, editName.trim()), () => { setEditing(null); setNotice('Le tag a été renommé.'); }); }} className="space-y-5">
        <label className="block text-sm text-t2">Nom du tag<input required maxLength={60} disabled={!!busy} value={editName} onChange={(event) => setEditName(event.target.value)} className="input mt-2" /></label>
        {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={!!busy} onClick={() => { setEditing(null); setFailure(null); }} className="btn-secondary">Annuler</button><button disabled={!!busy || !editName.trim()} className="btn-primary">{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
      </form>
    </AdminModal>
    <AdminConfirm open={!!pending} title="Supprimer ce tag ?" description={pending ? `« ${pending.name} » sera retiré de tous les articles qui le portent.` : ''} busy={!!busy} error={failure} onCancel={() => { setPending(null); setFailure(null); }} onConfirm={() => { if (pending) void act(`delete-${pending.id}`, () => adminApi.deleteTag(pending.id), () => { setPending(null); setNotice('Le tag a été supprimé.'); }); }} />
  </AdminSection>;
}
