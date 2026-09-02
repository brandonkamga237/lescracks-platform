import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { useSession } from '@/hooks/useSession';

/**
 * The back office chrome.
 *
 * Sober on purpose: one person uses this, and every hour spent styling it is an hour not
 * spent on the side that decides whether a beginner stays. Five destinations, no dashboard —
 * a dashboard is a screen you look at instead of doing the work.
 */
const SECTIONS = [
  { to: '/admin/ressources', label: 'Ressources' },
  { to: '/admin/evenements', label: 'Événements' },
  { to: '/admin/candidatures', label: 'Candidatures' },
  { to: '/admin/participations', label: 'Participations' },
  { to: '/admin/categories', label: 'Catégories' },
  { to: '/admin/tags', label: 'Tags' },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line-soft">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-sm text-t4 hover:text-t2">
            <LesCracksLogo className="h-6 w-auto" />
            <span className="hidden items-center gap-1.5 sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Le site
            </span>
          </Link>
          <span className="ml-auto text-sm text-t4">{name}</span>
        </div>
      </header>

      <nav className="border-b border-line-soft" aria-label="Sections du back-office">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6">
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 py-3 text-sm transition-colors ${
                  isActive
                    ? 'border-gold-400 text-t1'
                    : 'border-transparent text-t4 hover:text-t2'
                }`
              }
            >
              {section.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
