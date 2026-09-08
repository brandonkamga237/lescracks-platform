import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { CardSkeletonGrid } from '@/components/common/Skeleton';
import Layout from '@/components/layout/Layout';
import ResourceCard from '@/components/resources/ResourceCard';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { ResourceKind } from '@/services/types';

const KIND_LABEL = { EXTERNAL_VIDEO: 'Vidéos', EBOOK: 'Ebooks' } as const;
const KINDS: ResourceKind[] = ['EXTERNAL_VIDEO', 'EBOOK'];
const selectClass = 'mt-1.5 w-full rounded-lg border border-line bg-noir-900 px-3 py-2.5 text-sm text-t2 focus:border-gold-400 focus:outline-none';

function positiveInteger(value: string | null): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : undefined;
}

/**
 * The catalogue of learning resources.
 */
export default function Ressources() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeKind = location.pathname.endsWith('/ebooks') ? 'EBOOK' : location.pathname.endsWith('/videos') ? 'EXTERNAL_VIDEO' : undefined;
  const requestedKind = params.get('kind');
  const kind = routeKind ?? KINDS.find((value) => value === requestedKind);
  const search = params.get('q') ?? '';
  const categoryId = positiveInteger(params.get('categoryId'));
  const tagId = positiveInteger(params.get('tagId'));
  const page = positiveInteger(params.get('page')) ?? 1;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => api.tags(categoryId, signal), [categoryId]);
  const catalogue = useApi(
    async (signal) => {
      await new Promise<void>((resolve, reject) => {
        const cancel = () => { window.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
        const timer = window.setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, 250);
        signal.addEventListener('abort', cancel, { once: true });
      });
      return api.resources({ kind, search: search.trim() || undefined, categoryId, tagId, page: page - 1, size: 12 }, signal);
    },
    [kind, search, categoryId, tagId, page],
  );
  const visible = catalogue.data?.content ?? [];
  const hasFilters = Boolean(kind || search.trim() || categoryId || tagId);
  const total = catalogue.data?.totalElements ?? 0;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (kind) next.set('kind', kind);
    else next.delete('kind');
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    if (key === 'categoryId') next.delete('tagId');
    navigate({ pathname: '/ressources', search: next.toString() }, { replace: key === 'q' });
  }

  return (
    <Layout>
      <SEO title="Bibliothèque" description="Ebooks et vidéos pour apprendre la tech en français. Filtre par format, catégorie et sujet." url="/ressources" />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Bibliothèque</h1>
          <div className="flex items-center gap-3">
            {!catalogue.loading && !catalogue.error && (
              <p className="text-sm text-t4">{total} ressource{total > 1 ? 's' : ''}</p>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${filtersOpen ? 'border-gold-400 text-gold-400' : 'border-line text-t3 hover:text-t1'}`}
              aria-expanded={filtersOpen}
              aria-controls="resource-filters"
            >
              {filtersOpen ? <X className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}
              {filtersOpen ? 'Masquer' : 'Filtres'}
            </button>
          </div>
        </header>

        <div className={`mt-8 ${filtersOpen ? 'lg:grid lg:grid-cols-[220px_minmax(0,1fr)]' : ''} lg:gap-10`}>
          {/* Filters — a quiet rail, not a banner */}
          <aside id="resource-filters" className={`mb-8 border-t border-line-soft pt-6 lg:mb-0 lg:border-t-0 lg:pt-0 ${filtersOpen ? 'block' : 'hidden'}`} aria-label="Filtres">
            <div className="space-y-6 lg:sticky lg:top-28">
              <fieldset>
                <legend className="text-xs font-medium uppercase tracking-wider text-t4">Format</legend>
                <div className="mt-3 flex flex-col gap-1 border-l border-line">
                  {[undefined, ...KINDS].map((option) => (
                    <button
                      key={option ?? 'all'}
                      type="button"
                      aria-pressed={kind === option}
                      onClick={() => setParam('kind', option ?? null)}
                      className={`-ml-px border-l-2 pl-3 pr-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${kind === option ? 'border-gold-400 text-t1' : 'border-transparent text-t3 hover:text-t1'}`}
                    >
                      {option ? KIND_LABEL[option] : 'Tout'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block text-xs font-medium uppercase tracking-wider text-t4">
                Catégorie
                <select value={categoryId ?? ''} onChange={(event) => setParam('categoryId', event.target.value || null)} className={selectClass} disabled={categories.loading || Boolean(categories.error)}>
                  <option value="">Toutes</option>
                  {categoryId && !categories.data?.some((category) => category.id === categoryId) && <option value={categoryId}>Catégorie sélectionnée</option>}
                  {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>

              <label className="block text-xs font-medium uppercase tracking-wider text-t4">
                Sujet
                <select value={tagId ?? ''} onChange={(event) => setParam('tagId', event.target.value || null)} className={selectClass} disabled={tags.loading || Boolean(tags.error)}>
                  <option value="">Tous</option>
                  {tagId && !tags.data?.some((tag) => tag.id === tagId) && <option value={tagId}>Sujet sélectionné</option>}
                  {tags.data?.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                </select>
              </label>

              {(categories.error || tags.error) && (
                <p className="text-xs text-t3">
                  Certains filtres sont indisponibles.{' '}
                  <button type="button" onClick={() => { categories.reload(); tags.reload(); }} className="text-gold-400 underline underline-offset-4">Réessayer</button>
                </p>
              )}

              {hasFilters && (
                <button type="button" onClick={() => navigate('/ressources')} className="inline-flex items-center gap-1.5 text-sm text-t3 transition-colors hover:text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
                  <X className="h-3.5 w-3.5" aria-hidden />Effacer les filtres
                </button>
              )}
            </div>
          </aside>

          <section aria-label="Ressources" aria-live="polite" aria-busy={catalogue.loading}>
            <label htmlFor="resource-search" className="sr-only">Rechercher une ressource</label>
            <div className="flex items-center gap-3 border-b border-line pb-3 focus-within:border-gold-400">
              <Search className="h-4 w-4 shrink-0 text-t4" aria-hidden />
              <input
                id="resource-search"
                type="search"
                value={search}
                placeholder="Chercher un sujet, un outil…"
                onChange={(event) => setParam('q', event.target.value || null)}
                className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-t1 placeholder:text-t4 focus:outline-none"
              />
            </div>

            <div className="mt-8">
              {catalogue.loading && <CardSkeletonGrid count={6} />}
              {catalogue.error && (
                <div className="rounded-2xl border border-line bg-card px-6 py-14 text-center" role="alert">
                  <p className="font-medium text-t1">La bibliothèque est momentanément indisponible.</p>
                  <p className="mt-2 text-sm text-t3">{catalogue.error.message}</p>
                  <button type="button" onClick={catalogue.reload} className="btn-primary mt-5 !min-h-10 !px-4 !py-2">Réessayer</button>
                </div>
              )}
              {!catalogue.loading && !catalogue.error && visible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-line-strong bg-card px-6 py-14 text-center">
                  <p className="font-display text-xl text-t1">{page > 1 ? 'Cette page est vide.' : hasFilters ? 'Aucun résultat pour cette recherche.' : 'La bibliothèque se construit.'}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-t3">{hasFilters ? 'Essaie un autre mot-clé ou retire un filtre.' : page > 1 ? 'Reviens à la première page pour retrouver les ressources.' : 'Les ressources apparaîtront ici dès leur publication.'}</p>
                  {(hasFilters || page > 1) && <button type="button" onClick={page > 1 ? () => setParam('page', null) : () => navigate('/ressources')} className="mt-5 text-sm font-medium text-gold-400 underline underline-offset-4">{page > 1 ? 'Revenir à la première page' : 'Voir tout le catalogue'}</button>}
                </div>
              )}
              {visible.length > 0 && !catalogue.loading && !catalogue.error && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div>
                  <Pagination page={page} totalPages={catalogue.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
