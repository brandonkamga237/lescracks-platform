import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ArrowCircle } from '@/components/ui/arrow-circle';
import { cn } from '@/lib/utils';

interface ListRowProps {
  to: string;
  title: ReactNode;
  /** Before the title: a date, a thumbnail. */
  leading?: ReactNode;
  /** Under the title, on phones only, where `meta` has no room. */
  subtitle?: ReactNode;
  /** A column of details between the title and the arrow, from the small breakpoint up. */
  meta?: ReactNode;
  /** The grid columns, matched to which slots are filled. */
  columns: string;
  className?: string;
}

/**
 * One line of a list that opens a page: on hover a band fills from the left, the title slides
 * and turns gold, and the arrow fills.
 */
export function ListRow({ to, title, leading, subtitle, meta, columns, className }: ListRowProps) {
  return (
    <Link to={to} className={cn('group relative isolate grid items-center gap-4 border-b border-white/10 py-6 sm:gap-8', columns, className)}>
      <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white/[0.03] transition-transform duration-500 ease-out group-hover:scale-x-100" />
      {leading}
      <span className="min-w-0">
        <span className="block text-lg font-medium tracking-tight transition-[color,transform] duration-500 ease-out group-hover:translate-x-2 group-hover:text-gold-400 sm:text-2xl">{title}</span>
        {subtitle && <span className="mt-1 block text-sm text-white/50 sm:hidden">{subtitle}</span>}
      </span>
      {meta && <span className="hidden text-sm leading-relaxed text-white/50 sm:block">{meta}</span>}
      <ArrowCircle className="mr-2" />
    </Link>
  );
}
