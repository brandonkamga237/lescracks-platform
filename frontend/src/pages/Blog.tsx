import { useSearchParams } from 'react-router-dom';

import ArticleCard from '@/components/blog/ArticleCard';
import ArticleSpotlight from '@/components/blog/ArticleSpotlight';
import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section } from '@/components/layout/Page';
import { useApi } from '@/hooks/useApi';
import { LIST_PAGE_SIZE, worthFiltering } from '@/lib/filters';
import { api } from '@/services/api';

function pageNumber(value: string | null): number {
  if (!value || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  return Number(value);
}

/** The blog opens on its latest article, then the rest as a grid, newest first. */
export default function Blog() {
  const [params, setParams] = useSearchParams();
  const page = pageNumber(params.get('page'));
  const themes = useApi((signal) => api.categories(signal), []);
  // The theme travels by slug: /blog?theme=data-ia reads better in a shared link than an id.
  const themeSlug = params.get('theme') ?? undefined;
  const theme = themes.data?.find((item) => item.slug === themeSlug);
  const waitingForTheme = Boolean(themeSlug) && !themes.data && !themes.error;
  const blog = useApi((signal) => waitingForTheme ? new Promise<never>(() => undefined) : api.articles(page - 1, LIST_PAGE_SIZE, signal, theme?.id),
    [page, theme?.id, waitingForTheme]);
  const articles = blog.data?.content ?? [];
  const total = blog.data?.totalElements ?? 0;
  const spotlight = page === 1 && !theme ? articles[0] : undefined;
  const themePaths = new Map((themes.data ?? []).filter((item) => item.slug).map((item) => [item.id, `/blog?theme=${item.slug}`]));

  function selectTheme(slug: string | undefined) {
    setParams(slug ? { theme: slug } : {});
  }
  const rest = spotlight ? articles.slice(1) : articles;

  return (
    <Layout>
      <SEO title="Blog" description="Les articles LesCracks : retours d’expérience, notions expliquées et bonnes pratiques pour progresser en tech." url="/blog" />
      <Section tone="raised" spacing="tight" backdrop="/images/headers/library.jpg">
        <PageHeader
          eyebrow="À lire"
          title="Blog"
          description="Retours d’expérience, notions expliquées et bonnes pratiques pour progresser en tech."
          meta={!blog.loading && !blog.error ? `${total} article${total > 1 ? 's' : ''}` : undefined}
        />
        {!!themes.data?.length && worthFiltering(total, Boolean(theme)) && (
          <div className="mt-6">
            <FilterChips legend="Thème" allLabel="Tous" value={theme?.slug}
              options={themes.data.filter((item) => item.slug).map((item) => [item.slug as string, item.name])}
              onChange={selectTheme} />
          </div>
        )}
      </Section>

      <Section>
        <div aria-label="Articles" aria-live="polite" aria-busy={blog.loading} role="region">
          {blog.loading && articles.length === 0 && (
            <div role="status" className="space-y-5">
              {page === 1 && <Skeleton className="aspect-[16/10] sm:aspect-[21/9]" />}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[16/10]" />)}
              </div>
              <span className="sr-only">Chargement des articles…</span>
            </div>
          )}
          {blog.error && <ErrorState title="Le blog est momentanément indisponible." message={blog.error.message} onRetry={blog.reload} />}
          {!blog.loading && !blog.error && articles.length === 0 && (
            <EmptyState
              title={page > 1 ? 'Cette page est vide.' : theme ? `Pas encore d’article en ${theme.name}.` : 'Les premiers articles arrivent.'}
              description={page > 1 ? 'Reviens à la première page pour retrouver les articles.' : theme ? 'Les autres thèmes en ont peut-être.' : 'Ils apparaîtront ici dès leur publication.'}
              action={(page > 1 || theme) && <button type="button" onClick={() => setParams({})} className="btn-secondary">Voir tous les articles</button>}
            />
          )}
          {articles.length > 0 && !blog.error && (
            <div className={`transition-opacity ${blog.loading ? 'opacity-60' : ''}`}>
              {spotlight && <ArticleSpotlight article={spotlight} kicker="Dernier article" />}
              {rest.length > 0 && (
                <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${spotlight ? 'mt-16' : ''}`}>
                  {rest.map((article) => <ArticleCard key={article.id} article={article} themePath={themePaths.get(article.categoryId)} />)}
                </ul>
              )}
              <Pagination page={page} totalPages={blog.data?.totalPages ?? 0} onPageChange={(value) => {
                const next: Record<string, string> = theme?.slug ? { theme: theme.slug } : {};
                if (value > 1) next.page = String(value);
                setParams(next);
              }} />
            </div>
          )}
        </div>
      </Section>
    </Layout>
  );
}
