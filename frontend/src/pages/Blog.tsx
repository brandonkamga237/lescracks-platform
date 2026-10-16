import { useSearchParams } from 'react-router-dom';

import ArticleCard from '@/components/blog/ArticleCard';
import ArticleSpotlight from '@/components/blog/ArticleSpotlight';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section } from '@/components/layout/Page';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

function pageNumber(value: string | null): number {
  if (!value || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  return Number(value);
}

/** The blog opens on its latest article, then the rest as a grid, newest first. */
export default function Blog() {
  const [params, setParams] = useSearchParams();
  const page = pageNumber(params.get('page'));
  const blog = useApi((signal) => api.articles(page - 1, 12, signal), [page]);
  const articles = blog.data?.content ?? [];
  const total = blog.data?.totalElements ?? 0;
  const spotlight = page === 1 ? articles[0] : undefined;
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
              title={page > 1 ? 'Cette page est vide.' : 'Les premiers articles arrivent.'}
              description={page > 1 ? 'Reviens à la première page pour retrouver les articles.' : 'Ils apparaîtront ici dès leur publication.'}
              action={page > 1 && <button type="button" onClick={() => setParams({})} className="btn-secondary">Revenir à la première page</button>}
            />
          )}
          {articles.length > 0 && !blog.error && (
            <div className={`transition-opacity ${blog.loading ? 'opacity-60' : ''}`}>
              {spotlight && <ArticleSpotlight article={spotlight} kicker="Dernier article" />}
              {rest.length > 0 && (
                <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${spotlight ? 'mt-16' : ''}`}>
                  {rest.map((article) => <ArticleCard key={article.id} article={article} />)}
                </ul>
              )}
              <Pagination page={page} totalPages={blog.data?.totalPages ?? 0} onPageChange={(value) => setParams(value === 1 ? {} : { page: String(value) })} />
            </div>
          )}
        </div>
      </Section>
    </Layout>
  );
}
