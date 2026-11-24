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

const THEME_ROW = 'flex w-full items-center justify-between gap-3 rounded-full px-4 py-2 text-left text-sm transition-colors';

/**
 * The blog's two filters, grouped: themes as a list with their counts, tags as chips.
 * On a phone both scroll sideways above the cards; from a laptop they stand in a column.
 */
export default function BlogFilters({ themes, tags, theme, tag, onTheme, onTag }: BlogFiltersProps) {
  const [allTags, setAllTags] = useState(false);
  const total = themes.reduce((sum, item) => sum + item.articleCount, 0);
  const shownTags = allTags ? tags : tags.slice(0, TAGS_SHOWN);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/35 lg:px-4">Catégories</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0">
          {[{ slug: undefined, name: 'Toutes', articleCount: total }, ...themes].map((item) => {
            const active = item.slug === theme;
            return (
              <button key={item.slug ?? 'all'} type="button" aria-pressed={active} onClick={() => onTheme(item.slug)}
                className={cn(THEME_ROW, 'shrink-0 border lg:border-0', active ? 'border-gold-400 bg-gold-400 font-medium text-black lg:bg-white/[0.08] lg:text-white' : 'border-white/12 text-white/60 hover:text-white lg:hover:bg-white/[0.04]')}>
                <span className="whitespace-nowrap">{item.name}</span>
                <span className={cn('tabular-nums text-xs', active ? 'text-black/60 lg:text-gold-400' : 'text-white/35')}>{item.articleCount}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {tags.length > 0 && (
        <fieldset>
          <legend className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/35 lg:px-4">Tags</legend>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-4">
            {shownTags.map((item) => {
              const active = item.id === tag;
              return (
                <button key={item.id} type="button" aria-pressed={active} onClick={() => onTag(active ? undefined : item.id)}
                  className={cn('h-8 shrink-0 rounded-full border px-3 text-xs transition-colors', active ? 'border-gold-400 bg-gold-400/15 font-medium text-gold-400' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white')}>
                  #{item.name}
                </button>
              );
            })}
            {tags.length > TAGS_SHOWN && (
              <button type="button" onClick={() => setAllTags(!allTags)} className="h-8 shrink-0 px-2 text-xs text-white/45 underline-offset-4 hover:text-white hover:underline">
                {allTags ? 'Moins' : `+ ${tags.length - TAGS_SHOWN}`}
              </button>
            )}
          </div>
        </fieldset>
      )}
    </div>
  );
}
