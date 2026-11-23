import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import SignupNudge from '@/components/account/SignupNudge';
import VerifyEmailBanner from '@/components/account/VerifyEmailBanner';
import SpaceSidebar from '@/components/space/SpaceSidebar';
import SpaceTabBar, { SpaceTopBar } from '@/components/space/SpaceTabBar';
import { LEGAL_LINKS } from '@/config/site';
import { useSession } from '@/hooks/useSession';

const SKIP = 'sr-only z-[60] rounded-full bg-gold-400 px-5 py-3 font-medium text-black focus:not-sr-only focus:fixed focus:left-5 focus:top-3';

/**
 * The frame of the platform, past the landing: the sidebar for everyone, with the dashboard and the
 * account for a member, and the way to join for a visitor.
 */
export default function SiteShell({ children }: { children: ReactNode }) {
  const { isLoading, isSignedIn, isAdmin, user } = useSession();

  // Black until the session is known: a member never sees the visitor menu flash first.
  if (isLoading) return <div role="status" aria-label="Chargement" className="min-h-screen bg-black" />;

  const member = Boolean(isSignedIn && !isAdmin && user);

  return (
    <div className="min-h-screen bg-black font-geist text-white antialiased lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a href="#main-content" className={SKIP}>Aller au contenu</a>
      <SpaceSidebar member={member} />
      <div className="flex min-h-screen min-w-0 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        <SpaceTopBar member={member} />
        {member ? <VerifyEmailBanner /> : <SignupNudge />}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
        <footer className="border-t border-white/10 px-4 py-8 text-sm text-white/40 sm:px-8">
          <p className="flex flex-wrap gap-x-6 gap-y-2">
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
