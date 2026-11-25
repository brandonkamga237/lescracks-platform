import { cn } from '@/lib/utils';
import type { BlogTheme } from '@/services/types';

interface ThemeChipsProps {
  themes: BlogTheme[];
  theme?: string;
  onTheme: (slug: string | undefined) => void;
  className?: string;
}

/** The themes as one row of pills under the phone's search, for a choice in one tap; the sheet holds the rest. */
export default function ThemeChips({ themes, theme, onTheme, className }: ThemeChipsProps) {
  return (
    <div role="group" aria-label="Catégories" className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-8 sm:px-8', className)}>
      {[{ slug: undefined, name: 'Tout' }, ...themes].map((item) => {
        const active = item.slug === theme;
        return (
          <button key={item.slug ?? 'all'} type="button" aria-pressed={active} onClick={() => onTheme(item.slug)}
            className={cn('h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors active:scale-95 motion-reduce:active:scale-100', active ? 'border-gold-400 bg-gold-400 font-medium text-black' : 'border-white/12 text-white/70')}>
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
