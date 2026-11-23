import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface DashSectionProps {
  id: string;
  title: string;
  /** The page that holds the whole list. */
  more?: { to: string; label: string };
  children: ReactNode;
}

/** One block of the dashboard: a small title, a link to the full list, then the content. */
export default function DashSection({ id, title, more, children }: DashSectionProps) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={id} className="text-lg font-semibold tracking-tight">{title}</h2>
        {more && (
          <Link to={more.to} className="group inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white">
            {more.label}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
