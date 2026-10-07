import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, BookOpen, Eye, FileText, Heart, PenLine, Pencil, Plus, Search, Send, SlidersHorizontal, Trash2, TrendingUp, Video } from 'lucide-react';
import { AdminAction, AdminConfirm, AdminPagination, AdminRow, AdminSection, AdminState, StatusBadge } from '@/components/admin/AdminTable';
import ResourceForm from '@/components/admin/ResourceForm';
import { useApi } from '@/hooks/useApi';
import { adminApi, type AdminResourceFilters, type ArticleRequest, type EbookRequest } from '@/services/adminApi';
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const resources = useApi((signal) => adminApi.resources(filters, signal), [filters]);
  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => filters.categoryId ? api.tags(filters.categoryId, signal) : Promise.resolve([]), [filters.categoryId]);
  const views = useApi((signal) => adminApi.contentViews(30, signal), []);
  const viewsBySlug = new Map((views.data?.resources ?? []).map((r) => [r.slug, r.views]));
  const list = resources.data?.content ?? [];
  const field = 'input';
  const activeFilters = [filters.status, filters.kind, filters.categoryId, filters.tagId].filter(Boolean).length;

  async function changeStatus(resource: ResourceSummary, status: ResourceStatus) {
    const data: EbookRequest = { title: resource.title, description: resource.description, coverImage: resource.coverImage, categoryId: resource.categoryId, status };
    if (resource.kind === 'EBOOK') return adminApi.updateEbook(resource.id, data);
    if (resource.kind === 'ARTICLE') {
      const article: ArticleRequest = { ...data, body: resource.body ?? [] };
      return adminApi.updateArticle(resource.id, article);
    }
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

  return <AdminSection title="Ressources" description="Un catalogue utile, de la première idée à la publication." action={<div className="flex flex-wrap items-center gap-3"><Link to="/admin" className="btn-secondary"><TrendingUp className="h-4 w-4" aria-hidden />Les plus likés</Link><Link to="/admin/articles/nouveau" className="btn-primary"><PenLine className="h-4 w-4" aria-hidden />Écrire un article</Link><button type="button" onClick={() => setEditor('new')} className="btn-secondary"><Plus className="h-4 w-4" aria-hidden />Vidéo ou ebook</button></div>}>
    <div className="mb-6 rounded-lg border border-line-soft bg-card p-5">
      <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...filters, search: search.trim() || undefined, page: 0 }); }} className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 text-xs text-t3">Rechercher dans le catalogue<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre ou description…" className={`mt-2 ${field}`} /></label>
        <button type="submit" className="btn-secondary"><Search className="h-4 w-4" aria-hidden />Rechercher</button>
      </form>
      {/* On a phone the four selects would fill the first screen before any result. */}
      <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="resource-filters" className="btn-secondary mt-3 w-full sm:hidden"><SlidersHorizontal className="h-4 w-4" aria-hidden />Filtres{activeFilters > 0 && ` (${activeFilters})`}</button>
      <div id="resource-filters" className={`mt-4 gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4 ${filtersOpen ? 'grid' : 'hidden'}`}>
        <label className="text-xs text-t3">Statut<select value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, status: event.target.value as ResourceStatus || undefined })} className={`mt-2 ${field}`}><option value="">Tous les statuts</option><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée</option><option value="ARCHIVED">Archivée</option></select></label>
        <label className="text-xs text-t3">Type<select value={filters.kind ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, kind: event.target.value as ResourceKind || undefined })} className={`mt-2 ${field}`}><option value="">Tous les types</option><option value="EBOOK">Ebook</option><option value="EXTERNAL_VIDEO">Vidéo externe</option><option value="ARTICLE">Article</option></select></label>
        <label className="text-xs text-t3">Catégorie<select disabled={categories.loading || !!categories.error} value={filters.categoryId ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, categoryId: Number(event.target.value) || undefined, tagId: undefined })} className={`mt-2 ${field}`}><option value="">Toutes les catégories</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="text-xs text-t3">Tag<select disabled={!filters.categoryId || tags.loading || !!tags.error} value={filters.tagId ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, tagId: Number(event.target.value) || undefined })} className={`mt-2 ${field} disabled:opacity-40`}><option value="">{filters.categoryId ? 'Tous les tags' : 'Choisir une catégorie d’abord'}</option>{tags.data?.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
      </div>
      {(categories.error || tags.error) && <p role="alert" className="mt-3 text-sm text-error-ink">{categories.error?.message || tags.error?.message} <button type="button" onClick={() => { categories.reload(); tags.reload(); }} className="underline">Réessayer les filtres</button></p>}
      {(filters.search || filters.status || filters.kind || filters.categoryId) && <button type="button" onClick={() => { setSearch(''); setFilters({ page: 0 }); }} className="mt-4 text-xs text-gold-ink underline underline-offset-4">Réinitialiser les filtres</button>}
    </div>
    {notice && <p role="status" className="mb-5 text-sm text-gold-ink">{notice}</p>}
    <AdminState loading={resources.loading} error={resources.error} empty={!list.length} emptyMessage="Aucune ressource ici. Crée une ressource ou ajuste les filtres." onRetry={resources.reload}>
      {list.map((resource) => <AdminRow key={resource.id}>
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded bg-noir-800 text-gold-ink sm:flex">{resource.kind === 'EBOOK' ? <BookOpen className="h-5 w-5" aria-hidden /> : resource.kind === 'ARTICLE' ? <FileText className="h-5 w-5" aria-hidden /> : <Video className="h-5 w-5" aria-hidden />}</span>
        <div className="min-w-0 flex-1 basis-48"><h2 className="break-words text-base font-semibold leading-snug tracking-normal text-t1 sm:text-lg">{resource.title}</h2><p className="mt-1 text-xs leading-relaxed text-t3">{resource.kind === 'EBOOK' ? 'Ebook' : resource.kind === 'ARTICLE' ? 'Article' : 'Vidéo externe'} · {resource.categoryName} · {dateFormat.format(new Date(resource.createdAt))}</p></div>
        {resource.slug && viewsBySlug.has(resource.slug) && (
          <div className="flex items-center gap-1.5 rounded border border-line-soft bg-noir-950 px-2.5 py-1.5 text-xs text-t2" title="Consultations sur 30 jours"><Eye className="h-3.5 w-3.5 text-t3" aria-hidden />{viewsBySlug.get(resource.slug)}</div>
        )}
        <div className="flex items-center gap-1.5 rounded border border-line-soft bg-noir-950 px-2.5 py-1.5 text-xs text-t2"><Heart className="h-3.5 w-3.5 text-gold-ink" aria-hidden />{resource.likeCount ?? 0}</div>
        <StatusBadge status={resource.status} resource />
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${resource.title}`}>
          <AdminAction icon={Pencil} label="Modifier" disabled={!!busy[resource.id]} onClick={() => (resource.kind === 'ARTICLE' ? navigate(`/admin/articles/${resource.id}`, { state: { resource } }) : setEditor(resource))} />
          {resource.status !== 'PUBLISHED' && <AdminAction icon={Send} label={busy[resource.id] === 'publish' ? 'Publication…' : 'Publier'} disabled={!!busy[resource.id]} onClick={() => void act(resource, 'publish')} />}
          {resource.status !== 'ARCHIVED' && <AdminAction icon={Archive} label="Archiver" disabled={!!busy[resource.id]} onClick={() => confirm(resource, 'archive')} />}
          <AdminAction icon={Trash2} label="Supprimer" danger disabled={!!busy[resource.id]} onClick={() => confirm(resource, 'delete')} />
        </div>
        {errors[resource.id] && !pending && <p role="alert" className="w-full text-sm text-error-ink">{errors[resource.id]}</p>}
      </AdminRow>)}
    </AdminState>
    {resources.data && !resources.error && <AdminPagination page={filters.page ?? 0} totalPages={resources.data.totalPages} totalElements={resources.data.totalElements} busy={resources.loading} onChange={(page) => setFilters({ ...filters, page })} />}
    {editor && <ResourceForm key={editor === 'new' ? 'new' : editor.id} resource={editor === 'new' ? undefined : editor} onCancel={() => setEditor(null)} onCreated={() => { setEditor(null); setNotice('La ressource a été enregistrée.'); resources.reload(); }} />}
    <AdminConfirm open={!!pending} title={pending?.action === 'archive' ? 'Archiver cette ressource ?' : 'Supprimer cette ressource ?'} description={pending ? `« ${pending.resource.title} » : ${pending.action === 'archive' ? 'elle ne sera plus visible sur le site. Tu pourras la publier à nouveau.' : 'cette action est définitive et supprime aussi le fichier associé, le cas échéant.'}` : ''} busy={!!pending && !!busy[pending.resource.id]} error={pending ? errors[pending.resource.id] || null : null} onCancel={() => setPending(null)} onConfirm={() => { if (pending) void act(pending.resource, pending.action); }} label={pending?.action === 'archive' ? 'Archiver la ressource' : undefined} />
  </AdminSection>;
}
