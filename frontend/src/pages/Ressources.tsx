import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { CardSkeletonGrid } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section, Toolbar } from '@/components/layout/Page';
import ResourceCard from '@/components/resources/ResourceCard';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { ResourceKind } from '@/services/types';

const KIND_OPTIONS: Array<[ResourceKind, string]> = [
  ['EXTERNAL_VIDEO', 'Vidéos'],
  ['EBOOK', 'Ebooks'],
  ['ARTICLE', 'Articles'],
];

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
  const routeKind = location.pathname.endsWith('/ebooks') ? 'EBOOK' : location.pathname.endsWith('/videos') ? 'EXTERNAL_VIDEO' : location.pathname.endsWith('/articles') ? 'ARTICLE' : undefined;
  const requestedKind = params.get('kind');
  const kind = routeKind ?? KIND_OPTIONS.map(([value]) => value).find((value) => value === requestedKind);
  const search = params.get('q') ?? '';
  const categoryId = positiveInteger(params.get('categoryId'));
  const tagId = positiveInteger(params.get('tagId'));
  const page = positiveInteger(params.get('page')) ?? 1;
  const [refineOpen, setRefineOpen] = useState(false);
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
  const refineCount = (categoryId ? 1 : 0) + (tagId ? 1 : 0);

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
      <Section spacing="tight">
        <PageHeader
          title="Bibliothèque"
          description="Vidéos et ebooks pour apprendre la tech, en accès libre."
          meta={!catalogue.loading && !catalogue.error ? `${total} ressource${total > 1 ? 's' : ''}` : undefined}
        />

        <Toolbar
          lead={
            <div className="flex items-center gap-3 rounded-full border border-line/50 bg-noir-900/40 px-5 transition-colors focus-within:border-gold-400/50 focus-within:bg-noir-900/60">
              <Search className="h-4 w-4 shrink-0 text-t4" aria-hidden />
              <label htmlFor="resource-search" className="sr-only">Rechercher une ressource</label>
              <input
                id="resource-search"
                type="search"
                value={search}
                placeholder="Chercher un sujet, un outil…"
                onChange={(event) => setParam('q', event.target.value || null)}
                className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-t1 placeholder:text-t4 focus:outline-none"
              />
            </div>
          }
        >
          <FilterChips
            legend="Format"
            allLabel="Tout"
            options={KIND_OPTIONS}
            value={kind}
            onChange={(value) => setParam('kind', value ?? null)}
          />
          <button
            type="button"
            onClick={() => setRefineOpen((open) => !open)}
            aria-expanded={refineOpen}
            aria-controls="resource-refine"
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${refineOpen || refineCount ? 'border-gold-400/50 bg-gold-400/10 text-gold-300' : 'border-line-soft/70 bg-noir-900/40 text-t3 hover:text-t1'}`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Affiner
            {refineCount > 0 && <span className="rounded-full bg-gold-400 px-1.5 text-xs font-semibold text-black">{refineCount}</span>}
          </button>
          {hasFilters && (
            <button type="button" onClick={() => navigate('/ressources')} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-t3 transition-colors hover:text-t1">
              <X className="h-4 w-4" aria-hidden />Effacer
            </button>
          )}
        </Toolbar>

        {refineOpen && (
          <div id="resource-refine" className="mb-10 grid gap-4 rounded-3xl border border-line-soft/50 bg-noir-900/40 p-5 sm:grid-cols-2 sm:p-6">
            <label className="block text-sm font-medium text-t3">
              Catégorie
              <select value={categoryId ?? ''} onChange={(event) => setParam('categoryId', event.target.value || null)} className="input mt-2" disabled={categories.loading || Boolean(categories.error)}>
                <option value="">Toutes</option>
                {categoryId && !categories.data?.some((category) => category.id === categoryId) && <option value={categoryId}>Catégorie sélectionnée</option>}
                {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-t3">
              Sujet
              <select value={tagId ?? ''} onChange={(event) => setParam('tagId', event.target.value || null)} className="input mt-2" disabled={tags.loading || Boolean(tags.error)}>
                <option value="">Tous</option>
                {tagId && !tags.data?.some((tag) => tag.id === tagId) && <option value={tagId}>Sujet sélectionné</option>}
                {tags.data?.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
              </select>
            </label>

            {(categories.error || tags.error) && (
              <p className="text-sm text-t3 sm:col-span-2">
                Certains filtres sont indisponibles.{' '}
                <button type="button" onClick={() => { categories.reload(); tags.reload(); }} className="text-gold-400 underline underline-offset-4">Réessayer</button>
              </p>
            )}
          </div>
        )}

        <div aria-label="Ressources" aria-live="polite" aria-busy={catalogue.loading} role="region">
          {catalogue.loading && <CardSkeletonGrid count={6} />}
          {catalogue.error && (
            <ErrorState title="La bibliothèque est momentanément indisponible." message={catalogue.error.message} onRetry={catalogue.reload} />
          )}
          {!catalogue.loading && !catalogue.error && visible.length === 0 && (
            <EmptyState
              title={page > 1 ? 'Cette page est vide.' : hasFilters ? 'Aucun résultat pour cette recherche.' : 'La bibliothèque se construit.'}
              description={hasFilters ? 'Essaie un autre mot-clé ou retire un filtre.' : page > 1 ? 'Reviens à la première page pour retrouver les ressources.' : 'Les ressources apparaîtront ici dès leur publication.'}
              action={(hasFilters || page > 1) && (
                <button type="button" onClick={page > 1 ? () => setParam('page', null) : () => navigate('/ressources')} className="btn-secondary">
                  {page > 1 ? 'Revenir à la première page' : 'Voir tout le catalogue'}
                </button>
              )}
            />
          )}
          {visible.length > 0 && !catalogue.loading && !catalogue.error && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{visible.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div>
              <Pagination page={page} totalPages={catalogue.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} />
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
