import { useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { BlogTheme, Tag } from '@/services/types';

interface BlogFilterSheetProps {
  themes: BlogTheme[];
  tags: Tag[];
  theme?: string;
  tag?: number;
  onTheme: (slug: string | undefined) => void;
  onTag: (id: number | undefined) => void;
  onClear: () => void;
  /** Articles matching the current filters, shown on the button that closes the sheet. */
  found?: number;
  className?: string;
}

/**
 * Every filter of the blog on a phone, in a sheet that rises from the bottom: the whole list of
 * themes with their counts and every tag, where a sliding row would hide most of them.
 * A choice applies at once; the sheet stays open to combine a theme and a tag.
 */
export default function BlogFilterSheet({ themes, tags, theme, tag, onTheme, onTag, onClear, found, className }: BlogFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const active = (theme ? 1 : 0) + (tag ? 1 : 0);
  const total = themes.reduce((sum, item) => sum + item.articleCount, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={active ? `Filtres, ${active} actif${active > 1 ? 's' : ''}` : 'Filtres'}
        className={cn('relative flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors active:scale-95 motion-reduce:active:scale-100', active ? 'border-gold-400/60 bg-gold-400/10 text-gold-400' : 'border-white/12 bg-white/[0.04] text-white/80', className)}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filtres
        {active > 0 && <span aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-400 px-1 text-[11px] font-semibold text-black">{active}</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent position="bottom" className="gap-0 rounded-t-3xl border-white/10 bg-noir-900 p-0">
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
          <div className="px-5 pb-2 pt-4">
            <DialogTitle className="text-lg font-semibold">Filtrer les articles</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/50">Une catégorie, un tag, ou les deux.</DialogDescription>
          </div>

          <section aria-labelledby="sheet-themes" className="px-5 pt-4">
            <h3 id="sheet-themes" className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Catégories</h3>
            <ul role="radiogroup" aria-labelledby="sheet-themes" className="overflow-hidden rounded-2xl border border-white/10">
              {[{ slug: undefined, name: 'Toutes les catégories', articleCount: total }, ...themes].map((item) => {
                const chosen = item.slug === theme;
                return (
                  <li key={item.slug ?? 'all'} role="none" className="border-b border-white/[0.06] last:border-b-0">
                    <button type="button" role="radio" aria-checked={chosen} onClick={() => onTheme(item.slug)}
                      className={cn('flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] transition-colors active:bg-white/[0.06]', chosen ? 'bg-gold-400/[0.08] text-white' : 'text-white/75')}>
                      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border', chosen ? 'border-gold-400 bg-gold-400 text-black' : 'border-white/25')}>
                        {chosen && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="tabular-nums text-sm text-white/40">{item.articleCount}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {tags.length > 0 && (
            <section aria-labelledby="sheet-tags" className="px-5 pt-6">
              <h3 id="sheet-tags" className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((item) => {
                  const chosen = item.id === tag;
                  return (
                    <button key={item.id} type="button" aria-pressed={chosen} onClick={() => onTag(chosen ? undefined : item.id)}
                      className={cn('h-10 rounded-full border px-4 text-sm transition-colors active:scale-95 motion-reduce:active:scale-100', chosen ? 'border-gold-400 bg-gold-400 font-medium text-black' : 'border-white/12 text-white/70')}>
                      #{item.name}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-white/10 bg-noir-900 px-5 pb-1 pt-4">
            <Button type="button" variant="outline" size="lg" disabled={active === 0} onClick={onClear} className="flex-1">Effacer</Button>
            <Button type="button" size="lg" onClick={() => setOpen(false)} className="flex-[2] font-semibold">
              {found === undefined ? 'Voir les articles' : `Voir ${found} article${found > 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
