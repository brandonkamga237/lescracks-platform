import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Shield, User, X } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { useSession } from '@/hooks/useSession';

/**
 * Four destinations, no dropdowns.
 *
 * The previous header hid the catalogue behind a mega-menu that split it by format — a
 * distinction the catalogue itself no longer leads with. Nothing here needs a second level:
 * a site with four public sections does not have a navigation problem to solve.
 */
const LINKS = [
  { to: '/ressources', label: 'Ressources' },
  { to: '/evenements', label: 'Événements' },
  { to: '/programme', label: 'Accompagnement 360' },
  { to: '/about', label: 'À propos' },
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isAdmin, name, signIn, signOut } = useSession();

  // A menu that survives navigation traps the reader on the page they just left.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <Link to="/" className="shrink-0" aria-label="LesCracks, accueil">
          <LesCracksLogo className="h-7 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? 'text-t1' : 'text-t3 hover:text-t1'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-4 md:flex">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm text-t3 transition-colors hover:text-t1"
            >
              <Shield className="h-4 w-4" aria-hidden />
              Back-office
            </Link>
          )}

          {isSignedIn ? (
            <>
              <Link
                to="/profil"
                className="flex items-center gap-1.5 text-sm text-t2 transition-colors hover:text-t1"
              >
                <User className="h-4 w-4" aria-hidden />
                {name ?? 'Mon profil'}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-t4 transition-colors hover:text-t2"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void signIn()}
              className="rounded-full border border-line px-4 py-1.5 text-sm text-t2 transition-colors hover:border-gold-400 hover:text-t1"
            >
              Se connecter
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-auto text-t2 md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-line-soft md:hidden"
            aria-label="Navigation principale"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `py-2 text-base ${isActive ? 'text-t1' : 'text-t3'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="mt-3 flex flex-col gap-1 border-t border-line-soft pt-3">
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-t3">
                    Back-office
                  </Link>
                )}
                {isSignedIn ? (
                  <>
                    <Link to="/profil" onClick={() => setOpen(false)} className="py-2 text-t3">
                      Mon profil
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="py-2 text-left text-t4"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void signIn()}
                    className="py-2 text-left text-t2"
                  >
                    Se connecter
                  </button>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
