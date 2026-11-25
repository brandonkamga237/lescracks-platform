import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { BlogTheme, Tag } from '@/services/types';

const TAGS_SHOWN = 12;

interface BlogFiltersProps {
  themes: BlogTheme[];
  tags: Tag[];
  theme?: string;
  tag?: number;
  onTheme: (slug: string | undefined) => void;
  onTag: (id: number | undefined) => void;
}

const THEME_ROW = 'flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-left text-sm transition-colors active:scale-95 motion-reduce:active:scale-100 lg:h-auto lg:w-full lg:justify-between lg:border-0 lg:px-4 lg:py-2';
const HEADING = 'mb-2 px-4 text-xs font-medium uppercase tracking-wider text-white/35 max-lg:sr-only';

/**
 * The blog's two filters. On a phone, themes then tags share one row that slides sideways, so the
 * whole filter fits in one line of the sticky toolbar. From a laptop, they stand in a column:
 * themes as a list with their counts, tags as chips.
 */
export default function BlogFilters({ themes, tags, theme, tag, onTheme, onTag }: BlogFiltersProps) {
  const [allTags, setAllTags] = useState(false);
  const total = themes.reduce((sum, item) => sum + item.articleCount, 0);
  // On a phone every tag is in the row anyway: the "+ n" button only folds the laptop column.
  const shownTags = allTags ? tags : tags.slice(0, TAGS_SHOWN);

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-6 lg:overflow-visible lg:px-0">
      <div role="group" aria-labelledby="blog-themes" className="flex shrink-0 gap-2 lg:block">
        <p id="blog-themes" className={HEADING}>Catégories</p>
        <div className="flex gap-2 lg:block lg:space-y-0.5">
          {[{ slug: undefined, name: 'Toutes', articleCount: total }, ...themes].map((item) => {
            const active = item.slug === theme;
            return (
              <button key={item.slug ?? 'all'} type="button" aria-pressed={active} onClick={() => onTheme(item.slug)}
                className={cn(THEME_ROW, active ? 'border-gold-400 bg-gold-400 font-medium text-black lg:bg-white/[0.08] lg:text-white' : 'border-white/12 text-white/65 hover:text-white lg:hover:bg-white/[0.04]')}>
                <span className="whitespace-nowrap">{item.name}</span>
                <span className={cn('tabular-nums text-xs', active ? 'text-black/60 lg:text-gold-400' : 'text-white/35')}>{item.articleCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tags.length > 0 && (
        <>
          <span aria-hidden="true" className="h-6 w-px shrink-0 bg-white/15 lg:hidden" />
          <div role="group" aria-labelledby="blog-tags" className="flex shrink-0 gap-2 lg:block">
            <p id="blog-tags" className={HEADING}>Tags</p>
            <div className="flex gap-2 lg:flex-wrap lg:px-4">
              {tags.map((item, index) => {
                const active = item.id === tag;
                return (
                  <button key={item.id} type="button" aria-pressed={active} onClick={() => onTag(active ? undefined : item.id)}
                    className={cn(
                      'h-9 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs transition-colors active:scale-95 motion-reduce:active:scale-100 lg:h-8',
                      active ? 'border-gold-400 bg-gold-400/15 font-medium text-gold-400' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white',
                      index >= shownTags.length && 'lg:hidden',
                    )}>
                    #{item.name}
                  </button>
                );
              })}
              {tags.length > TAGS_SHOWN && (
                <button type="button" onClick={() => setAllTags(!allTags)} className="hidden h-8 shrink-0 px-2 text-xs text-white/45 underline-offset-4 hover:text-white hover:underline lg:inline-block">
                  {allTags ? 'Moins' : `+ ${tags.length - TAGS_SHOWN}`}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
