import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Heart } from 'lucide-react';

import ArticleCover from '@/components/blog/ArticleCover';
import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

// Beyond three, tags wrap to a second line on a phone and push the title down; the rest is summed up as "+N".
const MAX_TAGS = 3;

interface ArticleCardProps {
  article: ArticleSummary;
}

/** One article: cover, tags, title, then readers, likes and reading time. Every card has the same shape. */
function ArticleCard({ article }: ArticleCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const tags = article.tags ?? [];
  const hidden = tags.length - MAX_TAGS;
  const views = article.viewCount ?? 0;

  return (
    <li className="min-w-0">
      <Link
        to={articlePath(article)}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-line-soft bg-card transition-[border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 motion-reduce:hover:translate-y-0"
      >
        <span className="relative block aspect-[16/9] overflow-hidden bg-noir-700">
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
        <span className="flex min-w-0 flex-1 flex-col p-4">
          {tags.length > 0 && (
            <span className="mb-2.5 flex min-w-0 flex-wrap gap-1.5">
              {tags.slice(0, MAX_TAGS).map((tag) => (
                <span key={tag} className="max-w-full truncate rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-t3">{tag}</span>
              ))}
              {hidden > 0 && <span className="rounded px-1 py-0.5 font-mono text-[11px] text-t4" title={tags.slice(MAX_TAGS).join(', ')}>+{hidden}</span>}
            </span>
          )}
          <span className="line-clamp-2 break-words font-display text-base font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-ink">
            {article.title}
          </span>
          <span className="mt-auto flex items-center gap-4 pt-4 text-xs tabular-nums text-t3">
            {views > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" aria-hidden />
                {views.toLocaleString('fr-FR')}<span className="sr-only"> lectures</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {article.likeCount ?? 0}<span className="sr-only"> j’aime</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {article.readingMinutes ?? 1} min<span className="sr-only"> de lecture</span>
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export default memo(ArticleCard);
