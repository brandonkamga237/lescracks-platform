import ArticleRow from '@/components/blog/ArticleRow';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import type { ArticleSummary } from '@/services/types';

/** The latest articles of the blog. */
export default function LatestArticles({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section id="blog" aria-labelledby="articles-title">
      <Container className="pb-28 pt-16 sm:pt-20">
        <SectionHeading id="articles-title" eyebrow="Blog" title={['À lire.', { text: 'Les derniers articles du blog.', className: 'text-white/40' }]} action={{ to: '/blog', label: 'Tous les articles' }} />
        <Stagger className="mt-14 border-t border-white/10">
          {articles.map((article) => <StaggerItem key={article.id}><ArticleRow article={article} /></StaggerItem>)}
        </Stagger>
      </Container>
    </section>
  );
}
