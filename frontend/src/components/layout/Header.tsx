import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Info, LogOut, Menu, Podcast, Search, Shield, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/hooks/useSession';

/**
 * The sommaire: a numbered table of contents, not a navbar.
 *
 * Each destination carries a folio number — the same numbering grammar the
 * sections use on the pages themselves. Four destinations, no dropdowns.
 */
interface NavLinkDef {
  to: string;
  index: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** The Talk tab is dressed in gold: it announces a show, not a section of the site. */
  highlight?: boolean;
}

const LINKS: readonly NavLinkDef[] = [
  { to: '/ressources', index: '01', label: 'Bibliothèque', icon: BookOpen, description: 'Vidéos et ebooks, à ton rythme' },
  { to: '/evenements', index: '02', label: 'Événements', icon: CalendarDays, description: 'Les prochains rendez-vous tech' },
  { to: '/talk', index: '03', label: 'Talk', icon: Podcast, description: 'LesCracks Talk — la tech africaine en conversations', highlight: true },
  { to: '/a-propos', index: '04', label: 'À propos', icon: Info, description: 'Pourquoi LesCracks existe' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState('');
  const [draft, setDraft] = useState('');
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { isLoading, isSignedIn, isAdmin, name, signOut } = useSession();
  const destination = { from: `${pathname}${search}` };

  // A menu that survives navigation traps the reader on the page they just left.
  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = draft.trim();
    navigate(term ? `/ressources?q=${encodeURIComponent(term)}` : '/ressources');
  }

  async function logout() {
    setLeaving(true);
    setFailure('');
    try {
      await signOut();
      setOpen(false);
    } catch {
      setFailure('La déconnexion a échoué. Réessaie.');
    } finally {
      setLeaving(false);
    }
  }

  const accountActions = (
    <div className="space-y-2">
      <Link to={isAdmin ? '/admin' : '/profil'} onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2 rounded bg-white/5 px-3 text-sm text-t1 transition-colors hover:bg-white/10">
        {isAdmin ? <Shield className="h-4 w-4 text-gold" aria-hidden /> : <User className="h-4 w-4 text-gold" aria-hidden />}
        {isAdmin ? 'Administration' : 'Mon espace'}
        <ArrowRight className="ml-auto h-4 w-4" aria-hidden />
      </Link>
      <button type="button" disabled={leaving} onClick={() => void logout()} className="flex min-h-10 w-full items-center gap-2 rounded px-3 text-sm text-t3 transition-colors hover:bg-white/5 hover:text-t1 disabled:opacity-50">
        <LogOut className="h-4 w-4" aria-hidden />{leaving ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
      {failure && <p role="alert" className="px-3 text-sm text-error">{failure}</p>}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft/50 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Link to="/" className="shrink-0" aria-label="LesCracks, accueil">
          <LesCracksLogo height={32} className="w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `group flex items-baseline gap-2 text-sm transition-colors ${
              link.highlight
                ? isActive ? 'font-medium text-gold-300' : 'text-gold-400/80 hover:text-gold-300'
                : isActive ? 'font-medium text-t1' : 'text-t3 hover:text-t1'
            }`}>
              <span aria-hidden className="kicker-muted text-[10px] transition-colors group-hover:text-gold-400">{link.index}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-6 lg:flex">
          <form onSubmit={submitSearch} role="search" className="flex items-center gap-2 border-b border-line-soft/60 pb-1.5 transition-colors focus-within:border-gold-400/60">
            <Search className="h-3.5 w-3.5 text-t4" aria-hidden />
            <label htmlFor="nav-search" className="sr-only">Rechercher dans la bibliothèque</label>
            <input
              id="nav-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Rechercher…"
              className="w-28 bg-transparent text-sm text-t1 placeholder:text-t4 focus:outline-none xl:w-36"
            />
          </form>
          {isLoading ? <span role="status" className="h-9 w-24 animate-pulse rounded bg-white/5"><span className="sr-only">Vérification de la session…</span></span> : isSignedIn ? (
            <Link to={isAdmin ? '/admin' : '/profil'} className="flex items-center gap-2.5 text-sm text-t2 transition-colors hover:text-t1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-semibold text-gold">{name?.trim().charAt(0).toLocaleUpperCase('fr') || <User className="h-4 w-4" aria-hidden />}</span>
              <span className="max-w-32 truncate">{isAdmin ? 'Administration' : 'Mon espace'}</span>
            </Link>
          ) : (
            <><Link to="/connexion" state={destination} className="text-sm font-medium text-t2 transition-colors hover:text-t1">Se connecter</Link><Link to="/inscription" state={destination} className="btn-primary !px-4 !py-2 !text-sm">Créer un compte</Link></>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="ml-auto flex h-10 w-10 items-center justify-center rounded border border-line/50 text-t1 transition-colors hover:bg-white/5 lg:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" aria-hidden /></button>
          </DialogTrigger>
          <DialogContent className="top-2 w-[calc(100%_-_1rem)] translate-y-0 rounded-lg border-line bg-card p-4 sm:top-4 sm:w-[calc(100%_-_2rem)] sm:p-6">
            <DialogTitle className="font-display text-xl">Sommaire</DialogTitle>
            <DialogDescription className="text-sm">Un sujet, une ressource, un prochain pas.</DialogDescription>
            <nav aria-label="Navigation mobile" className="my-2">
              {LINKS.map(({ to, index, label, icon: Icon, description }) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 border-t border-line-soft/40 p-3 transition-colors ${isActive ? 'text-gold-300' : 'text-t1 hover:bg-white/[0.03]'}`}>
                  <span aria-hidden className="kicker-muted w-6">{index}</span>
                  <Icon className="h-4 w-4 shrink-0 text-t4" aria-hidden />
                  <span><span className="block text-sm font-medium">{label}</span><span className="mt-0.5 block text-xs text-t3">{description}</span></span>
                  <ArrowRight className="ml-auto h-4 w-4 text-t4" aria-hidden />
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-line-soft pt-3">
              {isLoading ? <p role="status" className="text-sm text-t3">Vérification de la session…</p> : isSignedIn ? accountActions : <div className="grid gap-2"><Link to="/inscription" state={destination} onClick={() => setOpen(false)} className="btn-primary py-2 text-sm">Créer un compte</Link><Link to="/connexion" state={destination} onClick={() => setOpen(false)} className="btn-secondary py-2 text-sm">Se connecter</Link></div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
