import { Link, NavLink, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { useSession } from '@/hooks/useSession';

/** Sticky bar on raised black, so it separates from pure-black bands as they scroll under it. */
interface NavLinkDef {
  to: string;
  label: string;
  /** CrackLab is dressed in gold: it is where members practise, the heart of the site. */
  highlight?: boolean;
}

const LINKS: readonly NavLinkDef[] = [
  { to: '/blog', label: 'Blog' },
  { to: '/formations', label: 'Formations' },
  { to: '/cracklab', label: 'CrackLab', highlight: true },
  { to: '/evenements', label: 'Événements' },
  { to: '/talk', label: 'Talk' },
  { to: '/a-propos', label: 'À propos' },
];

/** Phones navigate from the bottom tab bar; there the header only carries the logo. */
export default function Header() {
  const { pathname, search } = useLocation();
  const { isLoading, isSignedIn, isAdmin, name, user } = useSession();
  const destination = { from: `${pathname}${search}` };

  return (
    <header className="mode-raised sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-5 sm:px-8 lg:h-16">
        <Link to="/" className="shrink-0" aria-label="LesCracks, accueil">
          <LesCracksLogo height={32} className="w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `text-sm transition-colors ${
              link.highlight
                ? 'font-semibold text-gold-ink hover:text-t1'
                : isActive ? 'font-semibold text-t1' : 'font-medium text-t3 hover:text-t1'
            }`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-6 lg:flex">
          {isLoading ? <span role="status" className="h-9 w-24 animate-pulse rounded bg-noir-800"><span className="sr-only">Vérification de la session…</span></span> : isSignedIn ? (
            <Link to={isAdmin ? '/admin' : '/profil'} className="flex items-center gap-2.5 text-sm text-t2 transition-colors hover:text-t1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-semibold text-gold-ink">{name?.trim().charAt(0).toLocaleUpperCase('fr') || <User className="h-4 w-4" aria-hidden />}</span>
              <span className="max-w-32 truncate">{isAdmin ? 'Administration' : 'Mon compte'}</span>
              {!isAdmin && user && user.completion < 100 && <span title="Profil à compléter" className="rounded border border-gold-400/40 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-gold-ink">{user.completion} %</span>}
            </Link>
          ) : (
            <><Link to="/connexion" state={destination} className="text-sm font-medium text-t1 transition-colors hover:text-gold-ink">Se connecter</Link><Link to="/inscription" state={destination} className="btn-primary">Créer un compte</Link></>
          )}
        </div>

      </div>
    </header>
  );
}
