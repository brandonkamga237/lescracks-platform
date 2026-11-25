import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

import ArticleCard from '@/components/blog/ArticleCard';
import BlogFilters from '@/components/blog/BlogFilters';
import SEO from '@/components/common/SEO';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Pager } from '@/components/ui/pager';
import { EmptyPanel, ErrorPanel } from '@/components/ui/panels';
import { SearchField } from '@/components/ui/search-field';
import { SpaceHeader } from '@/components/ui/space-header';
import { useApi } from '@/hooks/useApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LIST_PAGE_SIZE } from '@/lib/filters';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

function positive(value: string | null): number | undefined {
  if (!value || !/^[1-9]\d{0,9}$/.test(value)) return undefined;
  return Number(value);
}

/** The blog: a search, the themes and tags beside it, the articles as cards. */
export default function Blog() {
  const [params, setParams] = useSearchParams();
  const page = positive(params.get('page')) ?? 1;
  const tagId = positive(params.get('tag'));
  // The theme travels by slug: /blog?theme=data-ia reads better in a shared link than an id.
  const themeSlug = params.get('theme') ?? undefined;
  const search = params.get('q') ?? '';
  const [typed, setTyped] = useState(search);
  const settled = useDebouncedValue(typed.trim(), 350);

  const themes = useApi((signal) => api.themes(signal), [], 'themes');
  const tags = useApi((signal) => api.tags(signal), [], 'tags');
  const theme = themes.data?.find((item) => item.slug === themeSlug);
  const tag = tags.data?.find((item) => item.id === tagId);
  const waitingForTheme = Boolean(themeSlug) && !themes.data && !themes.error;
  const blog = useApi(
    (signal) => (waitingForTheme ? new Promise<never>(() => undefined) : api.searchArticles({ search: search || undefined, categoryId: theme?.id, tagId, page: page - 1, size: LIST_PAGE_SIZE }, signal)),
    [search, theme?.id, tagId, page, waitingForTheme],
    waitingForTheme ? undefined : `blog:${search}:${theme?.id ?? ''}:${tagId ?? ''}:${page}`,
  );
  const articles = blog.data?.content ?? [];
  const total = blog.data?.totalElements ?? 0;
  const filtered = Boolean(search || theme || tagId);

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: 'q' in changes });
  }

  // The address follows the search once the typing pauses, so a search can be shared and survives a reload.
  useEffect(() => {
    if (settled !== search) update({ q: settled || undefined });
  }, [settled]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearAll() {
    setTyped('');
    setParams({});
  }

  return (
    <>
      <SEO title="Blog" description="Les articles LesCracks : retours d’expérience, notions expliquées et bonnes pratiques pour progresser en tech." url="/blog" />
      <SpaceHeader title="Blog" meta={!blog.loading && !blog.error ? `${total} article${total > 1 ? 's' : ''}${filtered ? ' trouvé' + (total > 1 ? 's' : '') : ''}` : undefined} />

      {/* One grid: a phone stacks search, filters, results; a wide screen keeps the filters in their own column. */}
      <Container className="grid gap-x-10 gap-y-5 pb-20 lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
        {/* On a phone, search and filters stay pinned under the top bar while the list scrolls;
            from a laptop the wrapper dissolves and each part takes its grid place. */}
        <div className="sticky top-16 z-30 -mx-4 space-y-3 border-b border-white/10 bg-black/90 px-4 pb-3 pt-2 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:contents lg:space-y-0">
          <SearchField value={typed} onChange={setTyped} label="Rechercher un article" className="min-w-0 lg:col-start-2" />

          <aside aria-label="Filtres" className="min-w-0 lg:sticky lg:top-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
            <BlogFilters
              themes={themes.data ?? []}
              tags={tags.data ?? []}
              theme={theme?.slug}
              tag={tagId}
              onTheme={(slug) => update({ theme: slug })}
              onTag={(id) => update({ tag: id ? String(id) : undefined })}
            />
          </aside>
        </div>

        <div className="min-w-0 lg:col-start-2">
          {filtered && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {search && <span className="rounded-full bg-white/[0.06] px-3 py-1 text-white/70">« {search} »</span>}
              {theme && <span className="rounded-full bg-white/[0.06] px-3 py-1 text-white/70">{theme.name}</span>}
              {tag && <span className="rounded-full bg-white/[0.06] px-3 py-1 text-white/70">#{tag.name}</span>}
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 px-2 text-white/45 transition-colors hover:text-white"><X className="h-3.5 w-3.5" aria-hidden="true" />Tout effacer</button>
            </div>
          )}

          <div role="region" aria-label="Articles" aria-live="polite" aria-busy={blog.loading}>
            {blog.loading && articles.length === 0 && (
              <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((index) => <div key={index} aria-hidden="true" className="h-80 animate-pulse rounded-3xl bg-white/[0.03] motion-reduce:animate-none" />)}
                <span className="sr-only">Chargement des articles…</span>
              </div>
            )}
            {blog.error && <ErrorPanel title="Le blog est momentanément indisponible." message={blog.error.message} onRetry={blog.reload} />}
            {!blog.loading && !blog.error && articles.length === 0 && (
              <EmptyPanel
                title={filtered ? 'Aucun article ne correspond.' : 'Les premiers articles arrivent.'}
                description={filtered ? 'Essaie d’autres mots, une autre catégorie ou un autre tag.' : 'Ils apparaîtront ici dès leur publication.'}
                action={filtered && <Button type="button" variant="outline" onClick={clearAll}>Voir tous les articles</Button>}
              />
            )}
            {articles.length > 0 && !blog.error && (
              <div className={cn('transition-opacity', blog.loading && 'opacity-60')}>
                <Stagger key={`${search}:${theme?.id}:${tagId}:${page}`} className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {articles.map((article, index) => {
                    // The newest article of the first unfiltered page leads, as a wide card.
                    const lead = index === 0 && page === 1 && !filtered && articles.length > 2;
                    return <StaggerItem key={article.id} className={lead ? 'sm:col-span-2 xl:col-span-3' : undefined}><ArticleCard article={article} wide={lead} compactOnPhone /></StaggerItem>;
                  })}
                </Stagger>
                <Pager page={page} totalPages={blog.data?.totalPages ?? 0} onPageChange={(value) => update({ page: value > 1 ? String(value) : undefined })} />
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
