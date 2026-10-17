import { memo, useState } from 'react';
import { Link } from 'react-router-dom';

import ArticleCover from '@/components/blog/ArticleCover';
import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

interface ArticleCardProps {
  article: ArticleSummary;
}

/** A compact blog card: cover, title, one meta line. The grid reads at a glance. */
function ArticleCard({ article }: ArticleCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const meta = [article.categoryName, `${article.readingMinutes ?? 1} min de lecture`].filter(Boolean).join('  ·  ');

  return (
    <li className="h-full">
      <Link
        to={articlePath(article)}
        className="group flex h-full overflow-hidden rounded bg-card transition-transform sm:flex-col duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 motion-reduce:hover:translate-y-0"
      >
        {/* Phones get a scannable row (thumbnail beside the title); wider screens the poster card. */}
        <span className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden bg-noir-700 sm:aspect-[16/9] sm:w-auto">
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
          <span className="line-clamp-3 break-words font-display text-[0.9375rem] font-semibold sm:line-clamp-2 sm:text-base leading-snug text-t1 transition-colors group-hover:text-gold-ink">
            {article.title}
          </span>
          <span className="mt-auto truncate pt-1 text-xs text-t4">{meta}</span>
        </span>
      </Link>
    </li>
  );
}

export default memo(ArticleCard);
