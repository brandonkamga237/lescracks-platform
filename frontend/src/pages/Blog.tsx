import { useSearchParams } from 'react-router-dom';

import ArticleCard from '@/components/blog/ArticleCard';
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

/** The blog as one grid of cards, newest first: no headline article, every card has the same weight. */
export default function Blog() {
  const [params, setParams] = useSearchParams();
  const page = pageNumber(params.get('page'));
  const themes = useApi((signal) => api.themes(signal), []);
  // The theme travels by slug: /blog?theme=data-ia reads better in a shared link than an id.
  const themeSlug = params.get('theme') ?? undefined;
  const theme = themes.data?.find((item) => item.slug === themeSlug);
  const waitingForTheme = Boolean(themeSlug) && !themes.data && !themes.error;
  const blog = useApi((signal) => waitingForTheme ? new Promise<never>(() => undefined) : api.articles(page - 1, LIST_PAGE_SIZE, signal, theme?.id),
    [page, theme?.id, waitingForTheme]);
  const articles = blog.data?.content ?? [];
  const total = blog.data?.totalElements ?? 0;

  function selectTheme(slug: string | undefined) {
    setParams(slug ? { theme: slug } : {});
  }

  return (
    <Layout>
      <SEO title="Blog" description="Les articles LesCracks : retours d’expérience, notions expliquées et bonnes pratiques pour progresser en tech." url="/blog" />
      <Section tone="raised" spacing="header">
        <PageHeader
          eyebrow="À lire"
          title="Blog"
          description="Retours d’expérience, notions expliquées et bonnes pratiques pour progresser en tech."
          meta={!blog.loading && !blog.error ? `${total} article${total > 1 ? 's' : ''}` : undefined}
        />
        {!!themes.data?.length && worthFiltering(total, Boolean(theme)) && (
          <div className="mt-6">
            <FilterChips legend="Thème" allLabel="Tous" value={theme?.slug}
              options={themes.data.map((item) => [item.slug, item.name])}
              onChange={selectTheme} />
          </div>
        )}
      </Section>

      <Section>
        <div aria-label="Articles" aria-live="polite" aria-busy={blog.loading} role="region">
          {blog.loading && articles.length === 0 && (
            <div role="status">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
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
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
              </ul>
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
