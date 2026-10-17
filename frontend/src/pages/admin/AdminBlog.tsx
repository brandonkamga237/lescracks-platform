import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, Eye, Heart, PenLine, Pencil, Search, Send, Trash2 } from 'lucide-react';
import { AdminAction, AdminConfirm, AdminPagination, AdminRow, AdminSection, AdminState, StatusBadge } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi, type AdminArticleFilters } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminArticle, ResourceStatus } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/**
 * The blog, from the other side.
 *
 * Publishing is its own act, separate from editing: a half-written article saved by mistake
 * must not appear on the blog because somebody hit save.
 */
export default function AdminBlog() {
  const [busy, setBusy] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ article: AdminArticle; action: 'delete' | 'archive' } | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdminArticleFilters>({ page: 0 });
  const navigate = useNavigate();
  const articles = useApi((signal) => adminApi.articles(filters, signal), [filters]);
  const views = useApi((signal) => adminApi.contentViews(30, signal), []);
  const viewsBySlug = new Map((views.data?.resources ?? []).map((r) => [r.slug, r.views]));
  const list = articles.data?.content ?? [];

  async function act(article: AdminArticle, action: 'publish' | 'archive' | 'delete') {
    if (busy[article.id]) return;
    setBusy((value) => ({ ...value, [article.id]: action }));
    setErrors((value) => ({ ...value, [article.id]: '' }));
    setNotice('');
    try {
      if (action === 'delete') await adminApi.deleteArticle(article.id);
      else await adminApi.updateArticle(article.id, {
        title: article.title, description: article.description, coverImage: article.coverImage,
        categoryId: article.categoryId, body: article.body ?? [], status: (action === 'publish' ? 'PUBLISHED' : 'ARCHIVED') as ResourceStatus,
      });
      setPending((value) => value?.article.id === article.id ? null : value);
      setNotice(action === 'delete' ? 'L’article a été supprimé.' : action === 'publish' ? 'L’article est publié.' : 'L’article est archivé.');
      if (list.length === 1 && (filters.page ?? 0) > 0 && (action === 'delete' || !!filters.status)) setFilters((value) => ({ ...value, page: (value.page ?? 0) - 1 }));
      else articles.reload();
    } catch (error) {
      setErrors((value) => ({ ...value, [article.id]: error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.' }));
    } finally {
      setBusy((value) => ({ ...value, [article.id]: '' }));
    }
  }

  function confirm(article: AdminArticle, action: 'delete' | 'archive') {
    setErrors((value) => ({ ...value, [article.id]: '' }));
    setPending({ article, action });
  }

  return <AdminSection title="Blog" description="Les articles, de la première idée à la publication." action={<Link to="/admin/articles/nouveau" className="btn-primary"><PenLine className="h-4 w-4" aria-hidden />Écrire un article</Link>}>
    <div className="mb-6 rounded-lg border border-line-soft bg-card p-5">
      <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...filters, search: search.trim() || undefined, page: 0 }); }} className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 text-xs text-t3">Rechercher un article<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre ou description…" className="input mt-2" /></label>
        <label className="text-xs text-t3">Statut<select value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, page: 0, status: event.target.value as ResourceStatus || undefined })} className="input mt-2"><option value="">Tous</option><option value="DRAFT">Brouillons</option><option value="PUBLISHED">Publiés</option><option value="ARCHIVED">Archivés</option></select></label>
        <button type="submit" className="btn-secondary"><Search className="h-4 w-4" aria-hidden />Rechercher</button>
      </form>
      {(filters.search || filters.status) && <button type="button" onClick={() => { setSearch(''); setFilters({ page: 0 }); }} className="mt-4 text-xs text-gold-ink underline underline-offset-4">Réinitialiser les filtres</button>}
    </div>
    {notice && <p role="status" className="mb-5 text-sm text-gold-ink">{notice}</p>}
    <AdminState loading={articles.loading} error={articles.error} empty={!list.length} emptyMessage="Aucun article ici. Écris le premier ou ajuste les filtres." onRetry={articles.reload}>
      {list.map((article) => <AdminRow key={article.id}>
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="break-words text-base font-semibold leading-snug tracking-normal text-t1 sm:text-lg">{article.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-t3">{[article.categoryName, `${article.readingMinutes ?? 1} min`, `créé le ${dateFormat.format(new Date(article.createdAt))}`].filter(Boolean).join(' · ')}</p>
        </div>
        {article.slug && viewsBySlug.has(article.slug) && (
          <div className="flex items-center gap-1.5 rounded border border-line-soft bg-noir-950 px-2.5 py-1.5 text-xs text-t2" title="Consultations sur 30 jours"><Eye className="h-3.5 w-3.5 text-t3" aria-hidden />{viewsBySlug.get(article.slug)}</div>
        )}
        <div className="flex items-center gap-1.5 rounded border border-line-soft bg-noir-950 px-2.5 py-1.5 text-xs text-t2"><Heart className="h-3.5 w-3.5 text-gold-ink" aria-hidden />{article.likeCount ?? 0}</div>
        <StatusBadge status={article.status} resource scheduledAt={article.scheduledAt} />
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${article.title}`}>
          <AdminAction icon={Pencil} label="Modifier" disabled={!!busy[article.id]} onClick={() => navigate(`/admin/articles/${article.id}`, { state: { resource: article } })} />
          {article.status !== 'PUBLISHED' && <AdminAction icon={Send} label={busy[article.id] === 'publish' ? 'Publication…' : article.scheduledAt ? 'Publier maintenant' : 'Publier'} disabled={!!busy[article.id]} onClick={() => void act(article, 'publish')} />}
          {article.status !== 'ARCHIVED' && <AdminAction icon={Archive} label="Archiver" disabled={!!busy[article.id]} onClick={() => confirm(article, 'archive')} />}
          <AdminAction icon={Trash2} label="Supprimer" danger disabled={!!busy[article.id]} onClick={() => confirm(article, 'delete')} />
        </div>
        {errors[article.id] && !pending && <p role="alert" className="w-full text-sm text-error-ink">{errors[article.id]}</p>}
      </AdminRow>)}
    </AdminState>
    {articles.data && !articles.error && <AdminPagination page={filters.page ?? 0} totalPages={articles.data.totalPages} totalElements={articles.data.totalElements} busy={articles.loading} onChange={(page) => setFilters({ ...filters, page })} />}
    <AdminConfirm open={!!pending} title={pending?.action === 'archive' ? 'Archiver cet article ?' : 'Supprimer cet article ?'} description={pending ? `« ${pending.article.title} » : ${pending.action === 'archive' ? 'il ne sera plus visible sur le blog. Tu pourras le publier à nouveau.' : 'cette action est définitive.'}` : ''} busy={!!pending && !!busy[pending.article.id]} error={pending ? errors[pending.article.id] || null : null} onCancel={() => setPending(null)} onConfirm={() => { if (pending) void act(pending.article, pending.action); }} label={pending?.action === 'archive' ? 'Archiver l’article' : undefined} />
  </AdminSection>;
}
