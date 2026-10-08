import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CircleUser, FlaskConical, Info, Lock, LogOut, Podcast, Shield, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/hooks/useSession';
import { fillClass } from '@/lib/cracklab';

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
                  <DialogDescription className="mt-1 text-sm text-t3">Ton compte pour télécharger les ebooks, relever les challenges et suivre les ateliers.</DialogDescription>
                </div>
              )}

              {isLoading ? (
                <p role="status" className="text-sm text-t3">Vérification de la session…</p>
              ) : isSignedIn ? (
                <>
                  {!isAdmin && user && user.completion < 100 && (
                    <Link to="/profil#informations" className="block rounded-lg border border-line p-3.5">
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-t1">Profil complété à <span className="font-mono tabular-nums text-gold-ink">{user.completion} %</span></span>
                        <span className="text-xs text-gold-ink">Compléter</span>
                      </span>
                      <span aria-hidden className="mt-2.5 block h-1 rounded-full bg-noir-700"><span className={`block h-full rounded-full bg-gold-400 ${fillClass(user.completion / 100)}`} /></span>
                    </Link>
                  )}
                  <nav aria-label="Ton compte">
                    {(isAdmin
                      ? [['/admin', 'Administration', Shield]] as const
                      : [['/profil', 'Mon compte', User], ['/cracklab/moi', 'Mon parcours CrackLab', FlaskConical], ['/profil#securite', 'Sécurité et connexion', Lock]] as const
                    ).map(([to, label, Icon]) => (
                      <Link key={to} to={to} className={row}>
                        <Icon className="h-4 w-4 text-t4" aria-hidden />{label}
                        <ArrowRight className="ml-auto h-4 w-4 text-t4" aria-hidden />
                      </Link>
                    ))}
                  </nav>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/inscription" state={destination} className="btn-primary">Créer un compte</Link>
                  <Link to="/connexion" state={destination} className="btn-secondary">Se connecter</Link>
                </div>
              )}

              <div>
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
