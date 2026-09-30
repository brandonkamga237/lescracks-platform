import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section, Toolbar } from '@/components/layout/Page';
import ResourceCard from '@/components/resources/ResourceCard';
import ResourceSpotlight from '@/components/resources/ResourceSpotlight';
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
 * The catalogue reads like a table of contents.
 *
 * Unfiltered, the page opens on the latest headline piece followed by the
 * index; filtered, it collapses to a dense ruled list meant for scanning.
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
    (signal) => api.resources({ kind, search: search.trim() || undefined, categoryId, tagId, page: page - 1, size: 12 }, signal),
    [kind, search, categoryId, tagId, page],
  );
  const visible = catalogue.data?.content ?? [];
  const hasFilters = Boolean(kind || search.trim() || categoryId || tagId);
  const total = catalogue.data?.totalElements ?? 0;
  const refineCount = (categoryId ? 1 : 0) + (tagId ? 1 : 0);
  const discovery = !hasFilters && page === 1;
  const spotlight = discovery ? visible[0] : undefined;
  const indexItems = spotlight ? visible.slice(1) : visible;

  const setParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (kind) next.set('kind', kind);
    else next.delete('kind');
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    if (key === 'categoryId') next.delete('tagId');
    navigate({ pathname: '/ressources', search: next.toString() }, { replace: key === 'q' });
  }, [params, kind, navigate]);

  // Typing stays local; the URL (and therefore the request) only follows after a pause.
  const [draft, setDraft] = useState(search);
  const lastSubmitted = useRef(search);
  useEffect(() => {
    if (draft === search) lastSubmitted.current = search;
    if (draft === lastSubmitted.current) return;
    const timer = window.setTimeout(() => {
      lastSubmitted.current = draft;
      setParam('q', draft.trim() || null);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, search, setParam]);

  // External URL changes (Effacer, breadcrumb, back button) must refill the field.
  useEffect(() => {
    setDraft(search);
  }, [search]);

  const cataloguePath = `${location.pathname}${location.search}`;

  return (
    <Layout>
      <SEO title="Bibliothèque" description="Ebooks et vidéos pour apprendre la tech en français. Filtre par format, catégorie et sujet." url="/ressources" />
      <Section spacing="tight">
        <PageHeader
          eyebrow="Le sommaire"
          title="Bibliothèque"
          description="Vidéos et ebooks pour apprendre la tech, en accès libre."
          meta={!catalogue.loading && !catalogue.error ? `${total} ressource${total > 1 ? 's' : ''}` : undefined}
        />

        <Toolbar
          lead={
            <div className="flex items-center gap-3 border-b border-line/60 pb-3 transition-colors focus-within:border-gold-400/60">
              <Search className="h-5 w-5 shrink-0 text-t4" aria-hidden />
              <label htmlFor="resource-search" className="sr-only">Rechercher une ressource</label>
              <input
                id="resource-search"
                type="search"
                value={draft}
                placeholder="Chercher un sujet, un outil…"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    lastSubmitted.current = draft;
                    setParam('q', draft.trim() || null);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent font-display text-xl font-medium text-t1 placeholder:text-t4 focus:outline-none sm:text-2xl"
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
            className={`relative inline-flex min-h-11 items-center gap-2 pb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${refineOpen || refineCount ? 'text-gold-300' : 'text-t3 hover:text-t1'}`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Affiner
            {refineCount > 0 && <span className="text-gold-ink">({refineCount})</span>}
          </button>
          {hasFilters && (
            <button type="button" onClick={() => navigate('/ressources')} className="inline-flex min-h-11 items-center gap-1.5 pb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-t3 transition-colors hover:text-t1">
              <X className="h-4 w-4" aria-hidden />Effacer
            </button>
          )}
        </Toolbar>

        {refineOpen && (
          <div id="resource-refine" className="mb-10 grid gap-4 rounded-lg border border-line-soft/50 bg-noir-900/40 p-5 sm:grid-cols-2 sm:p-6">
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
                <button type="button" onClick={() => { categories.reload(); tags.reload(); }} className="text-gold-ink underline underline-offset-4">Réessayer</button>
              </p>
            )}
          </div>
        )}

        <div aria-label="Ressources" aria-live="polite" aria-busy={catalogue.loading} role="region">
          {/* Skeleton only before the first payload: a refetch dims the results it replaces. */}
          {catalogue.loading && visible.length === 0 && (
            <div role="status" className="space-y-5">
              {discovery && <Skeleton className="aspect-[16/10] sm:aspect-[21/9]" />}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[16/10]" />)}
              </div>
              <span className="sr-only">Chargement du contenu…</span>
            </div>
          )}
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
          {visible.length > 0 && !catalogue.error && (
            <div className={`transition-opacity ${catalogue.loading ? 'opacity-60' : ''}`}>
              {spotlight && <ResourceSpotlight resource={spotlight} kicker="Dernière parution" cataloguePath={cataloguePath} />}
              <ul className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${spotlight ? 'mt-12' : ''}`}>
                {indexItems.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} cataloguePath={cataloguePath} />
                ))}
              </ul>
              <Pagination page={page} totalPages={catalogue.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} />
            </div>
          )}
        </div>
      </Section>
    </Layout>
  );
}
