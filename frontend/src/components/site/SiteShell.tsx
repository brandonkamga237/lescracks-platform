import { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import SignupNudge from '@/components/account/SignupNudge';
import VerifyEmailBanner from '@/components/account/VerifyEmailBanner';
import SpaceSidebar from '@/components/space/SpaceSidebar';
import SpaceTabBar, { SpaceTopBar } from '@/components/space/SpaceTabBar';
import { LEGAL_LINKS } from '@/config/site';
import { useSession } from '@/hooks/useSession';

const SKIP = 'sr-only z-[60] rounded-full bg-gold-400 px-5 py-3 font-medium text-black focus:not-sr-only focus:fixed focus:left-5 focus:top-3';

function ContentLoading() {
  return (
    <div role="status" aria-label="Chargement" className="flex min-h-[60vh] items-center justify-center">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent motion-reduce:animate-none" />
    </div>
  );
}

/**
 * The platform itself: one frame that stays put while only its content changes, with the dashboard
 * and the account for a member and the way to join for a visitor. A visitor's "/" is the landing,
 * which lives outside it.
 */
export default function SiteShell() {
  const { pathname } = useLocation();
  const { isLoading, isSignedIn, isAdmin, user } = useSession();

  // Black until the session is known: a member never sees the visitor menu, or the landing, flash first.
  if (isLoading) return <div role="status" aria-label="Chargement" className="min-h-screen bg-black" />;

  const member = Boolean(isSignedIn && !isAdmin && user);
  if (pathname === '/' && !member) return <Outlet />;

  return (
    <div className="min-h-screen bg-black font-geist text-white antialiased lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a href="#main-content" className={SKIP}>Aller au contenu</a>
      <SpaceSidebar member={member} />
      <div className="flex min-h-screen min-w-0 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <SpaceTopBar member={member} />
        {member ? <VerifyEmailBanner /> : <SignupNudge />}
        {/* Opacity only: moving between tabs happens all day, movement would tire. */}
        <main id="main-content" tabIndex={-1} key={pathname} className="flex-1 animate-page-in focus:outline-none">
          <Suspense fallback={<ContentLoading />}><Outlet /></Suspense>
        </main>
        <footer className="border-t border-white/10 px-4 py-4 text-xs text-white/35 sm:px-8 sm:py-6 sm:text-sm">
          <p className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-6">
            <span>© {new Date().getFullYear()} LesCracks</span>
            <Link to="/a-propos" className="transition-colors hover:text-white">À propos</Link>
            {LEGAL_LINKS.map((link) => <Link key={link.to} to={link.to} className="transition-colors hover:text-white">{link.label}</Link>)}
          </p>
        </footer>
      </div>
      <SpaceTabBar member={member} />
    </div>
  );
}
