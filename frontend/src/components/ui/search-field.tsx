import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Read aloud, and shown inside the empty field. */
  label: string;
  className?: string;
}

/** A search box with its magnifier and a button to clear it. */
export function SearchField({ value, onChange, label, className }: SearchFieldProps) {
  return (
    <div role="search" className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-full border border-white/10 bg-white/[0.04] pl-11 pr-12 text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white/45 transition-colors hover:text-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
