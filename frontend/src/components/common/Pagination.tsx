import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages]))
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);
  const buttonClass = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line px-3 text-sm text-t2 transition-colors hover:border-gold-400 hover:text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-line-soft pt-8">
      <button type="button" aria-label="Page précédente" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={buttonClass}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {pages.map((value, index) => (
        <span key={value} className="flex items-center gap-2">
          {index > 0 && value - pages[index - 1] > 1 && <span className="px-1 text-t4" aria-hidden>…</span>}
          <button
            type="button"
            aria-label={`Page ${value}`}
            aria-current={page === value ? 'page' : undefined}
            onClick={() => onPageChange(value)}
            className={`${buttonClass} ${page === value ? 'border-gold-400 bg-gold-400/10 text-gold-400' : ''}`}
          >
            {value}
          </button>
        </span>
      ))}
      <button type="button" aria-label="Page suivante" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className={buttonClass}>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
      <p className="mt-2 w-full text-center text-xs text-t3">Page {page} sur {totalPages}</p>
    </nav>
  );
}
