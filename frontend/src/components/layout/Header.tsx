import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Info, LogOut, Menu, Shield, User } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/hooks/useSession';

/**
 * Four destinations, no dropdowns.
 *
 * The previous header hid the catalogue behind a mega-menu that split it by format — a
 * distinction the catalogue itself no longer leads with. Nothing here needs a second level:
 * a site with four public sections does not have a navigation problem to solve.
 */
const LINKS = [
  { to: '/ressources', label: 'Bibliothèque', icon: BookOpen, description: 'Vidéos et ebooks, à ton rythme' },
  { to: '/evenements', label: 'Événements', icon: CalendarDays, description: 'Les prochains rendez-vous tech' },
  { to: '/a-propos', label: 'À propos', icon: Info, description: 'Pourquoi LesCracks existe' },
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState('');
  const { pathname, search } = useLocation();
  const { isLoading, isSignedIn, isAdmin, name, signOut } = useSession();
  const destination = { from: `${pathname}${search}` };

  // A menu that survives navigation traps the reader on the page they just left.
  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

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
      <Link to={isAdmin ? '/admin' : '/profil'} onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm text-t1 transition-colors hover:bg-white/10">
        {isAdmin ? <Shield className="h-4 w-4 text-gold" aria-hidden /> : <User className="h-4 w-4 text-gold" aria-hidden />}
        {isAdmin ? 'Administration' : 'Mon espace'}
        <ArrowRight className="ml-auto h-4 w-4" aria-hidden />
      </Link>
      <button type="button" disabled={leaving} onClick={() => void logout()} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-t3 transition-colors hover:bg-white/5 hover:text-t1 disabled:opacity-50">
        <LogOut className="h-4 w-4" aria-hidden />{leaving ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
      {failure && <p role="alert" className="px-3 text-sm text-error">{failure}</p>}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Link to="/" className="shrink-0" aria-label="LesCracks, accueil">
          <LesCracksLogo height={36} className="w-auto" />
        </Link>
        <span className="hidden h-6 w-px bg-line-strong lg:block" aria-hidden />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-white/[0.07] text-t1' : 'text-t3 hover:bg-white/5 hover:text-t1'}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          {isLoading ? <span role="status" className="h-10 w-28 animate-pulse rounded-full bg-white/5"><span className="sr-only">Vérification de la session…</span></span> : isSignedIn ? (
            <Link to={isAdmin ? '/admin' : '/profil'} className="flex items-center gap-3 rounded-full border border-line py-1.5 pl-1.5 pr-4 text-sm text-t2 transition-colors hover:border-line-strong hover:text-t1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 font-semibold text-gold">{name?.trim().charAt(0).toLocaleUpperCase('fr') || <User className="h-4 w-4" aria-hidden />}</span>
              <span className="max-w-32 truncate">{isAdmin ? 'Administration' : 'Mon espace'}</span>
            </Link>
          ) : (
            <><Link to="/connexion" state={destination} className="text-sm font-medium text-t2 transition-colors hover:text-t1">Se connecter</Link><Link to="/inscription" state={destination} className="btn-primary gap-2 !px-4 !py-2.5 !text-sm">Créer un compte<ArrowRight className="h-4 w-4" aria-hidden /></Link></>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-line text-t1 md:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" aria-hidden /></button>
          </DialogTrigger>
          <DialogContent className="top-2 w-[calc(100%_-_1rem)] translate-y-0 rounded-2xl border-line bg-card p-4 sm:top-4 sm:w-[calc(100%_-_2rem)] sm:p-6 sm:rounded-2xl">
            <DialogTitle className="font-display text-lg">Explorer LesCracks</DialogTitle>
            <DialogDescription className="text-sm">Un sujet, une ressource, un prochain pas.</DialogDescription>
            <nav aria-label="Navigation mobile" className="my-2 space-y-1.5">
              {LINKS.map(({ to, label, icon: Icon, description }) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl p-3 transition-colors ${isActive ? 'bg-gold/10 text-gold' : 'bg-white/5 text-t1 hover:bg-white/10'}`}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden /><span><span className="block text-sm font-medium">{label}</span><span className="mt-0.5 block text-xs text-t3">{description}</span></span><ArrowRight className="ml-auto h-4 w-4" aria-hidden />
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
