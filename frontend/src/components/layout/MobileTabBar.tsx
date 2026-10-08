import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CircleUser, FlaskConical, Info, LogOut, Podcast, Shield, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/hooks/useSession';

interface TabDef {
  to: string;
  label: string;
  icon: LucideIcon;
}

const TABS: readonly TabDef[] = [
  // No home tab: the logo in the header already leads home, and CrackLab earns the slot.
  { to: '/ressources', label: 'Biblio', icon: BookOpen },
  { to: '/evenements', label: 'Agenda', icon: CalendarDays },
  { to: '/talk', label: 'Talk', icon: Podcast },
  { to: '/cracklab', label: 'CrackLab', icon: FlaskConical },
];

const ACCOUNT_PATHS = ['/profil', '/connexion', '/inscription'];

const TAB_ITEM = 'flex min-h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400';

/**
 * Phone navigation: the four sections one thumb-tap away, the account and the rest in a sheet.
 * Colour change only — a bar touched dozens of times a session should not move.
 */
export default function MobileTabBar() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState('');
  const { pathname, search } = useLocation();
  const { isLoading, isSignedIn, isAdmin, name, email, signOut, user } = useSession();
  const destination = { from: `${pathname}${search}` };
  const accountActive = open || ACCOUNT_PATHS.includes(pathname);

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

  const row = 'flex min-h-12 items-center gap-3 border-t border-line-soft px-1 text-sm text-t1 transition-colors hover:text-gold-ink';

  return (
    <nav aria-label="Navigation principale" className="mode-raised fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'} className={({ isActive }) => `${TAB_ITEM} ${isActive ? 'text-gold-ink' : 'text-t3'}`}>
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
        <li>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button type="button" className={`${TAB_ITEM} ${accountActive ? 'text-gold-ink' : 'text-t3'}`}>
                <CircleUser className="h-5 w-5" aria-hidden />
                Compte
              </button>
            </DialogTrigger>
            <DialogContent position="bottom" className="mode-raised border-line bg-card">
              {isSignedIn ? (
                <div className="flex items-center gap-3 pr-8">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-semibold text-gold-ink">
                    {name?.trim().charAt(0).toLocaleUpperCase('fr') || <User className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="truncate font-display text-lg font-bold text-t1">{name || (isAdmin ? 'Administrateur' : 'Ton compte')}</DialogTitle>
                    <DialogDescription className="truncate text-sm text-t3">{email || (isAdmin ? 'Espace administrateur' : 'Ton espace LesCracks')}</DialogDescription>
                  </div>
                </div>
              ) : (
                <div className="pr-8">
                  <DialogTitle className="font-display text-xl font-bold text-t1">Ton compte</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-t3">La bibliothèque et l’agenda restent ouverts, avec ou sans compte.</DialogDescription>
                </div>
              )}

              {isLoading ? (
                <p role="status" className="text-sm text-t3">Vérification de la session…</p>
              ) : isSignedIn ? (
                <Link to={isAdmin ? '/admin' : '/profil'} className="btn-primary w-full">
                  {isAdmin ? <Shield className="h-4 w-4" aria-hidden /> : <User className="h-4 w-4" aria-hidden />}
                  {isAdmin ? 'Administration' : 'Mon espace'}
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/inscription" state={destination} className="btn-primary">Créer un compte</Link>
                  <Link to="/connexion" state={destination} className="btn-secondary">Se connecter</Link>
                </div>
              )}

              <div>
                {!isAdmin && user && user.completion < 100 && (
                  <Link to="/profil" className={row}>
                    <CircleUser className="h-4 w-4 text-gold-ink" aria-hidden />Compléter mon profil
                    <span className="ml-auto font-mono text-xs tabular-nums text-gold-ink">{user.completion} %</span>
                  </Link>
                )}
                <Link to="/a-propos" className={row}>
                  <Info className="h-4 w-4 text-t4" aria-hidden />À propos
                  <ArrowRight className="ml-auto h-4 w-4 text-t4" aria-hidden />
                </Link>
                {isSignedIn && (
                  <button type="button" disabled={leaving} onClick={() => void logout()} className={`${row} w-full text-t3 disabled:opacity-50`}>
                    <LogOut className="h-4 w-4" aria-hidden />{leaving ? 'Déconnexion…' : 'Se déconnecter'}
                  </button>
                )}
                {failure && <p role="alert" className="pt-2 text-sm text-error-ink">{failure}</p>}
              </div>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </nav>
  );
}
