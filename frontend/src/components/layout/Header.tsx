import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, User } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/hooks/useSession';

/** Sticky bar on raised black, so it separates from pure-black bands as they scroll under it. */
interface NavLinkDef {
  to: string;
  label: string;
  /** The Talk tab is dressed in gold: it announces a show, not a section of the site. */
  highlight?: boolean;
}

const LINKS: readonly NavLinkDef[] = [
  { to: '/ressources', label: 'Bibliothèque' },
  { to: '/evenements', label: 'Événements' },
  { to: '/talk', label: 'Talk', highlight: true },
  { to: '/a-propos', label: 'À propos' },
];

/** Phones navigate from the bottom tab bar; the header keeps the logo and the search. */
export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { isLoading, isSignedIn, isAdmin, name } = useSession();
  const destination = { from: `${pathname}${search}` };

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname, search]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = draft.trim();
    setSearchOpen(false);
    navigate(term ? `/ressources?q=${encodeURIComponent(term)}` : '/ressources');
  }

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
          <form onSubmit={submitSearch} role="search" className="flex h-10 items-center gap-2 rounded border border-line px-3 transition-colors focus-within:border-gold-400">
            <Search className="h-3.5 w-3.5 text-t4" aria-hidden />
            <label htmlFor="nav-search" className="sr-only">Rechercher dans la bibliothèque</label>
            <input
              id="nav-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Rechercher…"
              className="w-32 bg-transparent text-sm text-t1 placeholder:text-t4 focus:outline-none xl:w-48"
            />
          </form>
          {isLoading ? <span role="status" className="h-9 w-24 animate-pulse rounded bg-noir-800"><span className="sr-only">Vérification de la session…</span></span> : isSignedIn ? (
            <Link to={isAdmin ? '/admin' : '/profil'} className="flex items-center gap-2.5 text-sm text-t2 transition-colors hover:text-t1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-semibold text-gold-ink">{name?.trim().charAt(0).toLocaleUpperCase('fr') || <User className="h-4 w-4" aria-hidden />}</span>
              <span className="max-w-32 truncate">{isAdmin ? 'Administration' : 'Mon espace'}</span>
            </Link>
          ) : (
            <><Link to="/connexion" state={destination} className="text-sm font-medium text-t1 transition-colors hover:text-gold-ink">Se connecter</Link><Link to="/inscription" state={destination} className="btn-primary">Créer un compte</Link></>
          )}
        </div>

        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger asChild>
            <button type="button" className="ml-auto flex h-11 w-11 items-center justify-center rounded border border-line text-t1 transition-colors hover:bg-noir-800 lg:hidden" aria-label="Rechercher dans la bibliothèque"><Search className="h-5 w-5" aria-hidden /></button>
          </DialogTrigger>
          <DialogContent position="top" className="mode-raised w-[calc(100%_-_1rem)] rounded-lg border-line bg-card p-4 sm:w-[calc(100%_-_2rem)] sm:p-6">
            <DialogTitle className="font-display text-xl font-bold text-t1">Rechercher</DialogTitle>
            <DialogDescription className="text-sm text-t3">Un sujet, un outil, un titre de la bibliothèque.</DialogDescription>
            <form onSubmit={submitSearch} role="search" className="flex gap-2">
              <label htmlFor="mobile-search" className="sr-only">Rechercher dans la bibliothèque</label>
              {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
              <input id="mobile-search" type="search" autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ex. Git, Python, API…" className="input min-w-0 flex-1 text-base" />
              <button type="submit" className="btn-primary shrink-0 px-4" aria-label="Lancer la recherche"><ArrowRight className="h-4 w-4" aria-hidden /></button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
