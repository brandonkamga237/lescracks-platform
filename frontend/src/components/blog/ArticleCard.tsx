import { memo, useState } from 'react';
import { Link } from 'react-router-dom';

import ArticleCover from '@/components/blog/ArticleCover';
import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

interface ArticleCardProps {
  article: ArticleSummary;
  /** Where the theme label leads; without it the theme is plain text. */
  themePath?: string;
}

/** A compact blog card: cover, title, one meta line. The grid reads at a glance. */
function ArticleCard({ article, themePath }: ArticleCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  // The title link stretches over the whole card, so the theme can stay a link of its own instead of a link nested in a link.
  return (
    <li className="min-w-0">
      <article className="group relative flex h-full overflow-hidden rounded bg-card transition-transform duration-200 ease-out focus-within:ring-2 focus-within:ring-gold-400 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:flex-col">
        {/* Phones get a scannable row (thumbnail beside the title); wider screens the poster card. */}
        <span className="relative block aspect-[4/3] w-24 shrink-0 overflow-hidden bg-noir-700 sm:aspect-[16/9] sm:w-auto">
          {article.coverImage && failedImage !== article.coverImage ? (
            <img
              src={article.coverImage}
              alt=""
              loading="lazy"
              onError={() => setFailedImage(article.coverImage)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <ArticleCover />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <h3 className="line-clamp-3 break-words font-display text-[0.9375rem] font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-ink sm:line-clamp-2 sm:text-base">
            <Link to={articlePath(article)} className="after:absolute after:inset-0 focus-visible:outline-none">{article.title}</Link>
          </h3>
          <span className="mt-auto flex min-w-0 items-center gap-2 pt-1 text-xs text-t4">
            {article.categoryName && (themePath
              ? <Link to={themePath} className="relative z-10 truncate transition-colors hover:text-gold-ink">{article.categoryName}</Link>
              : <span className="truncate">{article.categoryName}</span>)}
            {article.categoryName && <span aria-hidden="true">·</span>}
            <span className="shrink-0">{article.readingMinutes ?? 1} min</span>
          </span>
        </span>
      </article>
    </li>
  );
}

export default memo(ArticleCard);
