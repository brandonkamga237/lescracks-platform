import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** Zero-based, as the API counts. The label adds the +1 humans expect. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const step = (delta: number) => onChange(Math.min(Math.max(page + delta, 0), totalPages - 1));
  const arrow =
    'p-2 rounded-lg border border-line text-t3 transition-colors ' +
    'hover:border-gold/50 hover:text-gold ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-t3';

  return (
    <nav className="flex items-center justify-center gap-3 mt-gutter" aria-label="Pagination">
      <button onClick={() => step(-1)} disabled={page === 0} aria-label="Page précédente" className={arrow}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-data text-t3 tabular-nums">
        Page {page + 1} sur {totalPages}
      </span>
      <button
        onClick={() => step(1)}
        disabled={page >= totalPages - 1}
        aria-label="Page suivante"
        className={arrow}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default Pagination;
