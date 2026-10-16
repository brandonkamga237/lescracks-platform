import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import ArticleCover from '@/components/blog/ArticleCover';
import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

interface ArticleSpotlightProps {
  article: ArticleSummary;
  /** Gold label above the title, e.g. "À la une". */
  kicker?: string;
}

/**
 * The featured article: an asymmetric editorial block, not a bigger card.
 * The cover leads, the serif title carries the rest.
 */
function ArticleSpotlight({ article, kicker = 'À la une' }: ArticleSpotlightProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const published = article.publishedAt ?? article.createdAt;
  const meta = [article.categoryName, `${article.readingMinutes ?? 1} min de lecture`, published && `Publié le ${dateFormat.format(new Date(published))}`]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <article className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <Link
        to={articlePath(article)}
        className="block aspect-[16/10] overflow-hidden bg-noir-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        aria-label={article.title}
      >
        {article.coverImage && failedImage !== article.coverImage ? (
          <img
            src={article.coverImage}
            alt=""
            onError={() => setFailedImage(article.coverImage)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
        ) : (
          <ArticleCover size="spotlight" />
        )}
      </Link>

      <div className="min-w-0">
        <p className="kicker">{kicker}</p>
        <h3 className="mt-5 break-words font-display text-4xl font-bold leading-[0.98] tracking-tight text-t1 sm:text-5xl xl:text-[3.25rem] xl:leading-[0.94]">
          <Link to={articlePath(article)} className="transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
            {article.title}
          </Link>
        </h3>
        <p className="mt-6 line-clamp-3 max-w-xl text-base leading-normal text-t3">{article.description}</p>
        <p className="label mt-6">{meta}</p>
        <Link to={articlePath(article)} className="btn-primary mt-8">
          Lire l’article
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export default memo(ArticleSpotlight);
