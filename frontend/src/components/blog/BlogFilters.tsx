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

const HEADING = 'mb-2 px-4 text-xs font-medium uppercase tracking-wider text-white/35';

/** The blog's filters in their own column on a wide screen: themes as a list with their counts, tags as chips. */
export default function BlogFilters({ themes, tags, theme, tag, onTheme, onTag }: BlogFiltersProps) {
  const [allTags, setAllTags] = useState(false);
  const total = themes.reduce((sum, item) => sum + item.articleCount, 0);
  const shownTags = allTags ? tags : tags.slice(0, TAGS_SHOWN);

  return (
    <div className="space-y-6">
      <div role="group" aria-labelledby="blog-themes">
        <p id="blog-themes" className={HEADING}>Catégories</p>
        <div className="space-y-0.5">
          {[{ slug: undefined, name: 'Toutes', articleCount: total }, ...themes].map((item) => {
            const active = item.slug === theme;
            return (
              <button key={item.slug ?? 'all'} type="button" aria-pressed={active} onClick={() => onTheme(item.slug)}
                className={cn('flex w-full items-center justify-between gap-3 rounded-full px-4 py-2 text-left text-sm transition-colors', active ? 'bg-white/[0.08] font-medium text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white')}>
                <span className="truncate">{item.name}</span>
                <span className={cn('tabular-nums text-xs', active ? 'text-gold-400' : 'text-white/35')}>{item.articleCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tags.length > 0 && (
        <div role="group" aria-labelledby="blog-tags">
          <p id="blog-tags" className={HEADING}>Tags</p>
          <div className="flex flex-wrap gap-2 px-4">
            {shownTags.map((item) => {
              const active = item.id === tag;
              return (
                <button key={item.id} type="button" aria-pressed={active} onClick={() => onTag(active ? undefined : item.id)}
                  className={cn('h-8 rounded-full border px-3 text-xs transition-colors', active ? 'border-gold-400 bg-gold-400/15 font-medium text-gold-400' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white')}>
                  #{item.name}
                </button>
              );
            })}
            {tags.length > TAGS_SHOWN && (
              <button type="button" onClick={() => setAllTags(!allTags)} className="h-8 px-2 text-xs text-white/45 underline-offset-4 hover:text-white hover:underline">
                {allTags ? 'Moins' : `+ ${tags.length - TAGS_SHOWN}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
