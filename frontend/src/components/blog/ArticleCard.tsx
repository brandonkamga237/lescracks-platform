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
  /**
   * On a phone, a list row instead of a card: a square thumbnail beside the title, so four or five
   * articles fit on a screen. From the small breakpoint up it is the regular card.
   */
  compactOnPhone?: boolean;
}

/** An article as a card: the cover left clear, then the title, the promise, and its facts at the foot. */
export default function ArticleCard({ article, wide = false, compactOnPhone = false }: ArticleCardProps) {
  const [broken, setBroken] = useState(false);
  const published = article.publishedAt ?? article.createdAt;
  const views = article.viewCount ?? 0;
  const cover = article.coverImage && !broken;
  const compact = compactOnPhone && !wide;

  return (
    <Link
      to={articlePath(article)}
      className={cn(
        'group relative flex h-full overflow-hidden border border-white/10 bg-white/[0.03] transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out hover:border-gold-400/40 hover:bg-white/[0.05] active:scale-[0.99] motion-reduce:transform-none sm:hover:-translate-y-1 sm:hover:shadow-[0_24px_48px_-24px_rgba(212,175,55,0.25)] sm:active:translate-y-0',
        wide ? 'flex-col rounded-3xl md:flex-row' : compact ? 'flex-row rounded-2xl sm:flex-col sm:rounded-3xl' : 'flex-col rounded-3xl',
      )}
    >
      <div className={cn(
        'relative shrink-0 overflow-hidden bg-noir-900',
        wide ? 'aspect-[16/9] md:aspect-auto md:w-1/2' : compact ? 'm-3 h-24 w-24 rounded-xl sm:m-0 sm:aspect-[16/9] sm:h-auto sm:w-auto sm:rounded-none' : 'aspect-[16/9]',
      )}>
        {cover
          ? <img src={article.coverImage} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none" />
          : (
            // No cover: the theme stands in for it, so the card never opens on an empty block.
            <div aria-hidden="true" className={cn('absolute inset-0 flex items-end justify-between bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.22),transparent_55%),linear-gradient(135deg,#141414,#0a0a0a)]', compact ? 'justify-center p-0 sm:justify-between sm:p-4' : 'p-4', compact && 'items-center sm:items-end')}>
              <span className={cn('max-w-[70%] text-2xl font-semibold leading-tight tracking-tight text-white/15', compact && 'hidden sm:block')}>{article.categoryName}</span>
              <Newspaper className={cn('text-gold-400/40', compact ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-8 w-8')} />
            </div>
          )}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col', wide ? 'p-5 md:p-7' : compact ? 'py-3 pr-4 sm:p-5' : 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn(
            'font-semibold leading-snug tracking-tight transition-colors group-hover:text-gold-400',
            wide ? 'line-clamp-2 text-xl md:text-2xl' : compact ? 'line-clamp-3 text-[15px] sm:line-clamp-2 sm:text-[17px]' : 'line-clamp-2 text-[17px]',
          )}>{article.title}</h3>
          <ArrowUpRight aria-hidden="true" className={cn('mt-0.5 h-5 w-5 shrink-0 -translate-x-1 translate-y-1 text-gold-400 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none', compact && 'hidden sm:block')} />
        </div>
        {article.description && <p className={cn('mt-2 text-sm leading-relaxed text-white/55', wide ? 'line-clamp-3' : 'line-clamp-2', compact && 'hidden sm:block')}>{article.description}</p>}
        <div aria-hidden="true" className={cn('flex-1', compact ? 'min-h-2 sm:min-h-5' : 'min-h-5')} />

        <div className={cn('mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2', compact ? 'sm:border-t sm:border-white/[0.07] sm:pt-4' : 'border-t border-white/[0.07] pt-4')}>
          {article.categoryName && <CategoryChip name={article.categoryName} className={compact ? 'max-sm:px-2 max-sm:py-0.5 max-sm:text-[10px]' : undefined} />}
          <p className="flex items-center gap-3 text-xs text-white/45">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /><time dateTime={published}>{dateFormat.format(new Date(published))}</time></span>
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{article.readingMinutes ?? 1} min</span>
            {views > 0 && <span className={cn('items-center gap-1', compact ? 'hidden sm:inline-flex' : 'inline-flex')}><Eye className="h-3.5 w-3.5" aria-hidden="true" />{views.toLocaleString('fr-FR')}<span className="sr-only"> lectures</span></span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
