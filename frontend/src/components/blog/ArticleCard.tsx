import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock3, Eye, Newspaper } from 'lucide-react';

import { CategoryChip } from '@/components/ui/category-chip';
import { articlePath } from '@/lib/slugs';
import { cn } from '@/lib/utils';
import type { ArticleSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

interface ArticleCardProps {
  article: ArticleSummary;
  /** Laid out wide, cover beside the text: the first article of a list. */
  wide?: boolean;
}

/** An article as a card: the cover left clear, then the title, the promise, and its facts at the foot. */
export default function ArticleCard({ article, wide = false }: ArticleCardProps) {
  const [broken, setBroken] = useState(false);
  const published = article.publishedAt ?? article.createdAt;
  const views = article.viewCount ?? 0;
  const cover = article.coverImage && !broken;

  return (
    <Link
      to={articlePath(article)}
      className={cn(
        'group relative flex h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/[0.05] hover:shadow-[0_24px_48px_-24px_rgba(212,175,55,0.25)] active:translate-y-0 active:scale-[0.99] motion-reduce:transform-none',
        wide ? 'flex-col md:flex-row' : 'flex-col',
      )}
    >
      <div className={cn('relative shrink-0 overflow-hidden bg-noir-900', wide ? 'aspect-[16/9] md:aspect-auto md:w-1/2' : 'aspect-[16/9]')}>
        {cover
          ? <img src={article.coverImage} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none" />
          : (
            // No cover: the theme stands in for it, so the card never opens on an empty block.
            <div aria-hidden="true" className="absolute inset-0 flex items-end justify-between bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.22),transparent_55%),linear-gradient(135deg,#141414,#0a0a0a)] p-4">
              <span className="max-w-[70%] text-2xl font-semibold leading-tight tracking-tight text-white/15">{article.categoryName}</span>
              <Newspaper className="h-8 w-8 text-gold-400/40" />
            </div>
          )}
      </div>

      <div className={cn('flex flex-1 flex-col p-5', wide && 'md:p-7')}>
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn('line-clamp-2 font-semibold leading-snug tracking-tight transition-colors group-hover:text-gold-400', wide ? 'text-xl md:text-2xl' : 'text-[17px]')}>{article.title}</h3>
          <ArrowUpRight aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 -translate-x-1 translate-y-1 text-gold-400 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none" />
        </div>
        {article.description && <p className={cn('mt-2 text-sm leading-relaxed text-white/55', wide ? 'line-clamp-3' : 'line-clamp-2')}>{article.description}</p>}
        <div aria-hidden="true" className="min-h-5 flex-1" />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/[0.07] pt-4">
          {article.categoryName && <CategoryChip name={article.categoryName} />}
          <p className="flex items-center gap-3 text-xs text-white/45">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /><time dateTime={published}>{dateFormat.format(new Date(published))}</time></span>
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{article.readingMinutes ?? 1} min</span>
            {views > 0 && <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{views.toLocaleString('fr-FR')}<span className="sr-only"> lectures</span></span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
