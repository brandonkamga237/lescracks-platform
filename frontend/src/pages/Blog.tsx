import { useSearchParams } from 'react-router-dom';

import ArticleRow from '@/components/blog/ArticleRow';
import SEO from '@/components/common/SEO';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import SiteShell from '@/components/site/SiteShell';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Pager } from '@/components/ui/pager';
import { EmptyPanel, ErrorPanel, RowsLoading } from '@/components/ui/panels';
import { PillTabs } from '@/components/ui/pill-tabs';
import { useApi } from '@/hooks/useApi';
import { LIST_PAGE_SIZE, worthFiltering } from '@/lib/filters';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

function pageNumber(value: string | null): number {
  if (!value || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  return Number(value);
}

/** The blog as one list of published lines, newest first, filterable by theme. */
export default function Blog() {
  const [params, setParams] = useSearchParams();
  const page = pageNumber(params.get('page'));
  const themes = useApi((signal) => api.themes(signal), []);
  // The theme travels by slug: /blog?theme=data-ia reads better in a shared link than an id.
  const themeSlug = params.get('theme') ?? undefined;
  const theme = themes.data?.find((item) => item.slug === themeSlug);
  const waitingForTheme = Boolean(themeSlug) && !themes.data && !themes.error;
  const blog = useApi((signal) => (waitingForTheme ? new Promise<never>(() => undefined) : api.articles(page - 1, LIST_PAGE_SIZE, signal, theme?.id)),
    [page, theme?.id, waitingForTheme]);
  const articles = blog.data?.content ?? [];
  const total = blog.data?.totalElements ?? 0;

  function goTo(value: number) {
    const next: Record<string, string> = theme?.slug ? { theme: theme.slug } : {};
    if (value > 1) next.page = String(value);
    setParams(next);
  }

  return (
    <SiteShell>
      <SEO title="Blog" description="Les articles LesCracks : retours d’expérience, notions expliquées et bonnes pratiques pour progresser en tech." url="/blog" />
      <PageHero
        id="blog-title"
        eyebrow={!blog.loading && !blog.error ? `Blog · ${total} article${total > 1 ? 's' : ''}` : 'Blog'}
        title={['À lire.', { text: 'Écrit par celles et ceux qui pratiquent.', className: 'text-white/40' }]}
        lead="Retours d’expérience, notions expliquées simplement et bonnes pratiques pour progresser en tech."
      >
        {!!themes.data?.length && worthFiltering(total, Boolean(theme)) && (
          <PillTabs legend="Thème" allLabel="Tous les thèmes" value={theme?.slug} options={themes.data.map((item) => [item.slug, item.name])} onChange={(slug) => setParams(slug ? { theme: slug } : {})} />
        )}
      </PageHero>

      <Container className="pb-24">
        <div role="region" aria-label="Articles" aria-live="polite" aria-busy={blog.loading}>
          {blog.loading && articles.length === 0 && <RowsLoading label="Chargement des articles…" />}
          {blog.error && <ErrorPanel title="Le blog est momentanément indisponible." message={blog.error.message} onRetry={blog.reload} />}
          {!blog.loading && !blog.error && articles.length === 0 && (
            <EmptyPanel
              title={page > 1 ? 'Cette page est vide.' : theme ? `Pas encore d’article en ${theme.name}.` : 'Les premiers articles arrivent.'}
              description={page > 1 ? 'Reviens à la première page pour retrouver les articles.' : theme ? 'Les autres thèmes en ont peut-être.' : 'Ils apparaîtront ici dès leur publication.'}
              action={(page > 1 || theme) && <Button type="button" variant="outline" onClick={() => setParams({})}>Voir tous les articles</Button>}
            />
          )}
          {articles.length > 0 && !blog.error && (
            <div className={cn('transition-opacity', blog.loading && 'opacity-60')}>
              <Stagger className="border-t border-white/10">
                {articles.map((article) => <StaggerItem key={article.id}><ArticleRow article={article} /></StaggerItem>)}
              </Stagger>
              <Pager page={page} totalPages={blog.data?.totalPages ?? 0} onPageChange={goTo} />
            </div>
          )}
        </div>
      </Container>
    </SiteShell>
  );
}
