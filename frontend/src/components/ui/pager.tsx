import { ArrowLeft, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PagerProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CIRCLE = 'grid h-11 min-w-11 place-items-center rounded-full border px-3 text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-30';

/** Page numbers as circles: the first, the last and the neighbours of the current one. */
export function Pager({ page, totalPages, onPageChange }: PagerProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages])).filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-2">
      <button type="button" aria-label="Page précédente" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={cn(CIRCLE, 'border-white/15 text-white/70 hover:border-gold-400 hover:text-white')}><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
      {pages.map((value, index) => (
        <span key={value} className="flex items-center gap-2">
          {index > 0 && value - pages[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-white/30">…</span>}
          <button type="button" aria-current={value === page ? 'page' : undefined} onClick={() => onPageChange(value)}
            className={cn(CIRCLE, value === page ? 'border-gold-400 bg-gold-400 font-medium text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white')}>
            {value}
          </button>
        </span>
      ))}
      <button type="button" aria-label="Page suivante" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className={cn(CIRCLE, 'border-white/15 text-white/70 hover:border-gold-400 hover:text-white')}><ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
    </nav>
  );
}
