import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

interface DashSectionProps {
  id: string;
  title: string;
  /** Read before the title: the block is found by its picture before its words. */
  Icon?: LucideIcon;
  /** The page that holds the whole list. */
  more?: { to: string; label: string };
  children: ReactNode;
}

/** One block of the dashboard: a small title, a link to the full list, then the content. */
export default function DashSection({ id, title, Icon, more, children }: DashSectionProps) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id={id} className="flex items-center gap-2.5 text-base font-semibold tracking-tight sm:text-lg">
          {Icon && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold-400/10 text-gold-400"><Icon className="h-4 w-4" aria-hidden="true" /></span>}
          {title}
        </h2>
        {more && (
          <Link to={more.to} className="group inline-flex min-h-9 shrink-0 items-center gap-1 text-sm text-white/50 transition-colors hover:text-white">
            {more.label}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
