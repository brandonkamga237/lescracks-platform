import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, FlaskConical, Home, Trophy, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useSession } from '@/hooks/useSession';

interface CrackLabLayoutProps {
  children: ReactNode;
}

interface Section {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const SECTIONS: readonly Section[] = [
  { to: '/cracklab', label: 'Challenges', icon: FlaskConical, end: true },
  { to: '/cracklab/classement', label: 'Classement', icon: Trophy },
  { to: '/cracklab/mes-reponses', label: 'Mes réponses', icon: FileText },
];

/** The wordmark: monospace, so the lab reads as its own place while staying in the LesCracks palette. */
export function CrackLabMark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-mono font-bold tracking-tight text-t1 ${className}`}>
      Crack<span className="text-gold-ink">Lab</span><span aria-hidden className="text-gold-ink motion-safe:animate-pulse">_</span>
    </span>
  );
}

const TAB = 'flex min-h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400';

/**
 * CrackLab's own chrome: a separate space with its own header and tab bar, sharing the
 * LesCracks session. A way back to the main site is always one tap away.
 */
export default function CrackLabLayout({ children }: CrackLabLayoutProps) {
  const { pathname } = useLocation();
  const { isLoading, isSignedIn, isAdmin, name } = useSession();
  const initial = name?.trim().charAt(0).toLocaleUpperCase('fr');

  return (
    <div className="flex min-h-screen flex-col bg-black pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-t1 lg:pb-0">
      <a href="#cracklab-content" className="sr-only z-[60] rounded bg-gold px-5 py-3 font-medium text-black focus:not-sr-only focus:fixed focus:left-5 focus:top-3">Aller au contenu</a>

      <header className="sticky top-0 z-40 border-b border-line bg-noir-900/95 backdrop-blur supports-[backdrop-filter]:bg-noir-900/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5 sm:px-8 lg:h-16">
          <Link to="/cracklab" aria-label="CrackLab, accueil" className="flex shrink-0 items-baseline gap-2">
            <CrackLabMark className="text-lg" />
            <span className="hidden text-[11px] uppercase tracking-[0.12em] text-t4 sm:inline">par LesCracks</span>
          </Link>

          <nav aria-label="CrackLab" className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `rounded px-3 py-2 text-sm transition-colors ${isActive ? 'bg-noir-800 font-semibold text-t1' : 'text-t3 hover:text-t1'}`}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Link to="/" className="hidden items-center gap-1.5 text-sm text-t3 transition-colors hover:text-t1 sm:inline-flex">
              <ArrowLeft className="h-4 w-4" aria-hidden />LesCracks
            </Link>
            {isLoading ? null : isSignedIn ? (
              <Link to={isAdmin ? '/admin/cracklab/challenges' : '/profil'} aria-label={isAdmin ? 'Administration CrackLab' : 'Mon espace'}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-sm font-semibold text-gold-ink">
                {initial || <User className="h-4 w-4" aria-hidden />}
              </Link>
            ) : (
              <Link to="/connexion" state={{ from: pathname }} className="btn-primary min-h-9 px-4 py-1.5">Se connecter</Link>
            )}
          </div>
        </div>
      </header>

      <main id="cracklab-content" tabIndex={-1} key={pathname} className="flex-1 animate-page-in outline-none">
        {children}
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-8 text-sm text-t4 sm:flex-row sm:items-center sm:px-8">
          <p><CrackLabMark /> · des challenges d’ingénierie notés critère par critère.</p>
          <Link to="/" className="link inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" aria-hidden />Retour à LesCracks</Link>
        </div>
      </footer>

      <nav aria-label="CrackLab, navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-noir-900 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-4">
          {SECTIONS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => `${TAB} ${isActive ? 'text-gold-ink' : 'text-t3'}`}>
                <Icon className="h-5 w-5" aria-hidden />{label}
              </NavLink>
            </li>
          ))}
          <li>
            <Link to="/" className={`${TAB} text-t3`}><Home className="h-5 w-5" aria-hidden />LesCracks</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
