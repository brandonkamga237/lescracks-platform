import { useState } from 'react';
import { BookOpen, Plus, Search, Video } from 'lucide-react';
import { AdminConfirm, AdminPagination, AdminRow, AdminSection, AdminState, StatusBadge } from '@/components/admin/AdminTable';
import ResourceForm from '@/components/admin/ResourceForm';
import { useApi } from '@/hooks/useApi';
import { adminApi, type AdminResourceFilters, type EbookRequest } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { ResourceKind, ResourceStatus, ResourceSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/**
 * The catalogue, from the other side.
 *
 * Publishing is its own act, separate from editing: a half-written article saved by mistake
 * must not appear on the public catalogue because somebody hit save.
 */
export default function AdminResources() {
  const [busy, setBusy] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<ResourceSummary | 'new' | null>(null);
  const [pending, setPending] = useState<{ resource: ResourceSummary; action: 'delete' | 'archive' } | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdminResourceFilters>({ page: 0 });
  const resources = useApi((signal) => adminApi.resources(filters, signal), [filters]);
  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => filters.categoryId ? api.tags(filters.categoryId, signal) : Promise.resolve([]), [filters.categoryId]);
  const list = resources.data?.content ?? [];
  const field = 'w-full rounded-2xl border border-line bg-noir-900 px-4 py-3 text-sm text-t1 focus:border-gold-400 focus:outline-none';
  const actionClass = 'rounded-full border border-line px-3 py-2 text-xs font-medium text-t2 hover:border-gold-400/40 hover:text-gold-400 disabled:opacity-40';

  async function changeStatus(resource: ResourceSummary, status: ResourceStatus) {
    const data: EbookRequest = { title: resource.title, description: resource.description, coverImage: resource.coverImage, categoryId: resource.categoryId, status };
    if (resource.kind === 'EBOOK') return adminApi.updateEbook(resource.id, data);
    if (!resource.videoUrl || !resource.platform) throw new ApiError(0, { message: 'Le lien ou la plateforme manque. Complète la ressource avant de la publier.' });
    return adminApi.updateVideo(resource.id, { ...data, videoUrl: resource.videoUrl, platform: resource.platform });
  }

  async function act(resource: ResourceSummary, action: 'publish' | 'archive' | 'delete') {
    if (busy[resource.id]) return;
    setBusy((value) => ({ ...value, [resource.id]: action }));
    setErrors((value) => ({ ...value, [resource.id]: '' }));
    setNotice('');
    try {
      if (action === 'delete') await adminApi.deleteResource(resource.id);
      else await changeStatus(resource, action === 'publish' ? 'PUBLISHED' : 'ARCHIVED');
      setPending((value) => value?.resource.id === resource.id ? null : value);
      setNotice(action === 'delete' ? 'La ressource a été supprimée.' : action === 'publish' ? 'La ressource est publiée.' : 'La ressource est archivée.');
      if (list.length === 1 && (filters.page ?? 0) > 0 && (action === 'delete' || !!filters.status)) setFilters((value) => ({ ...value, page: (value.page ?? 0) - 1 }));
      else resources.reload();
    } catch (error) { setErrors((value) => ({ ...value, [resource.id]: error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.' })); }
    finally { setBusy((value) => ({ ...value, [resource.id]: '' })); }
  }

  function confirm(resource: ResourceSummary, action: 'delete' | 'archive') {
    setErrors((value) => ({ ...value, [resource.id]: '' }));
    setPending({ resource, action });
  }

  return <AdminSection title="Ressources" description="Un catalogue utile, de la première idée à la publication." action={<button type="button" onClick={() => setEditor('new')} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black"><Plus className="h-4 w-4" aria-hidden />Nouvelle ressource</button>}>
    <div className="mb-6 rounded-2xl border border-line-soft bg-card p-5">
      <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...filters, search: search.trim() || undefined, page: 0 }); }} className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 text-xs text-t3">Rechercher dans le catalogue<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre ou description…" className={`mt-2 ${field}`} /></label>
        <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm text-t2"><Search className="h-4 w-4" aria-hidden />Rechercher</button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-t3">Statut<select value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, status: event.target.value as ResourceStatus || undefined })} className={`mt-2 ${field}`}><option value="">Tous les statuts</option><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée</option><option value="ARCHIVED">Archivée</option></select></label>
        <label className="text-xs text-t3">Type<select value={filters.kind ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, kind: event.target.value as ResourceKind || undefined })} className={`mt-2 ${field}`}><option value="">Tous les types</option><option value="EBOOK">Ebook</option><option value="EXTERNAL_VIDEO">Vidéo externe</option></select></label>
        <label className="text-xs text-t3">Catégorie<select disabled={categories.loading || !!categories.error} value={filters.categoryId ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, categoryId: Number(event.target.value) || undefined, tagId: undefined })} className={`mt-2 ${field}`}><option value="">Toutes les catégories</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="text-xs text-t3">Tag<select disabled={!filters.categoryId || tags.loading || !!tags.error} value={filters.tagId ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, tagId: Number(event.target.value) || undefined })} className={`mt-2 ${field} disabled:opacity-40`}><option value="">{filters.categoryId ? 'Tous les tags' : 'Choisir une catégorie d’abord'}</option>{tags.data?.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
      </div>
      {(categories.error || tags.error) && <p role="alert" className="mt-3 text-sm text-gold-400">{categories.error?.message || tags.error?.message} <button type="button" onClick={() => { categories.reload(); tags.reload(); }} className="underline">Réessayer les filtres</button></p>}
      {(filters.search || filters.status || filters.kind || filters.categoryId) && <button type="button" onClick={() => { setSearch(''); setFilters({ page: 0 }); }} className="mt-4 text-xs text-gold-400 underline underline-offset-4">Réinitialiser les filtres</button>}
    </div>
    {notice && <p role="status" className="mb-5 text-sm text-gold-400">{notice}</p>}
    <AdminState loading={resources.loading} error={resources.error} empty={!list.length} emptyMessage="Aucune ressource ici. Crée une ressource ou ajuste les filtres." onRetry={resources.reload}>
      {list.map((resource) => <AdminRow key={resource.id}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-noir-800 text-gold-400">{resource.kind === 'EBOOK' ? <BookOpen className="h-5 w-5" aria-hidden /> : <Video className="h-5 w-5" aria-hidden />}</span>
        <div className="min-w-0 flex-1 basis-48"><h2 className="break-words font-display font-medium text-t1">{resource.title}</h2><p className="mt-1 text-xs leading-relaxed text-t3">{resource.kind === 'EBOOK' ? 'Ebook' : 'Vidéo externe'} · {resource.categoryName} · {dateFormat.format(new Date(resource.createdAt))}</p></div>
        <StatusBadge status={resource.status} resource />
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${resource.title}`}>
          <button type="button" disabled={!!busy[resource.id]} onClick={() => setEditor(resource)} className={actionClass}>Modifier</button>
          {resource.status !== 'PUBLISHED' && <button type="button" disabled={!!busy[resource.id]} onClick={() => void act(resource, 'publish')} className={actionClass}>{busy[resource.id] === 'publish' ? 'Publication…' : 'Publier'}</button>}
          {resource.status !== 'ARCHIVED' && <button type="button" disabled={!!busy[resource.id]} onClick={() => confirm(resource, 'archive')} className={actionClass}>Archiver</button>}
          <button type="button" disabled={!!busy[resource.id]} onClick={() => confirm(resource, 'delete')} className={actionClass}>Supprimer</button>
        </div>
        {errors[resource.id] && !pending && <p role="alert" className="w-full text-sm text-gold-400">{errors[resource.id]}</p>}
      </AdminRow>)}
    </AdminState>
    {resources.data && !resources.error && <AdminPagination page={filters.page ?? 0} totalPages={resources.data.totalPages} totalElements={resources.data.totalElements} busy={resources.loading} onChange={(page) => setFilters({ ...filters, page })} />}
    {editor && <ResourceForm key={editor === 'new' ? 'new' : editor.id} resource={editor === 'new' ? undefined : editor} onCancel={() => setEditor(null)} onCreated={() => { setEditor(null); setNotice('La ressource a été enregistrée.'); resources.reload(); }} />}
    <AdminConfirm open={!!pending} title={pending?.action === 'archive' ? 'Archiver cette ressource ?' : 'Supprimer cette ressource ?'} description={pending ? `« ${pending.resource.title} » : ${pending.action === 'archive' ? 'elle ne sera plus visible sur le site. Tu pourras la publier à nouveau.' : 'cette action est définitive et supprime aussi le fichier associé, le cas échéant.'}` : ''} busy={!!pending && !!busy[pending.resource.id]} error={pending ? errors[pending.resource.id] || null : null} onCancel={() => setPending(null)} onConfirm={() => { if (pending) void act(pending.resource, pending.action); }} label={pending?.action === 'archive' ? 'Archiver la ressource' : undefined} />
  </AdminSection>;
}
