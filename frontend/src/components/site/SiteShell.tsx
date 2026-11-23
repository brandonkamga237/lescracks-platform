import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import SignupNudge from '@/components/account/SignupNudge';
import VerifyEmailBanner from '@/components/account/VerifyEmailBanner';
import SpaceSidebar from '@/components/space/SpaceSidebar';
import SpaceTabBar, { SpaceTopBar } from '@/components/space/SpaceTabBar';
import type { NavItem } from '@/components/site/navigation';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { LEGAL_LINKS, SPACES } from '@/config/site';
import { useSession } from '@/hooks/useSession';
import type { EventSummary } from '@/services/types';

interface SiteShellProps {
  children: ReactNode;
  /** The visitor's bar links; the platform's spaces unless a page lights up its own sections. */
  items?: NavItem[];
  nextEvent?: EventSummary;
  /** The page opens on a full-height hero that runs under the visitor's floating bar. */
  flush?: boolean;
}

const SKIP = 'sr-only z-[60] rounded-full bg-gold-400 px-5 py-3 font-medium text-black focus:not-sr-only focus:fixed focus:left-5 focus:top-3';

/**
 * The frame of every page: the member space and its sidebar once a member is signed in, the landing's
 * floating bar and footer for everyone else.
 */
export default function SiteShell({ children, items = SPACES, nextEvent, flush = false }: SiteShellProps) {
  const { isLoading, isSignedIn, isAdmin, user } = useSession();

  // Black until the session is known: a member never sees the visitor frame flash first.
  if (isLoading) return <div role="status" aria-label="Chargement" className="min-h-screen bg-black" />;

  if (isSignedIn && !isAdmin && user) {
    return (
      <div className="min-h-screen bg-black font-geist text-white antialiased lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <a href="#main-content" className={SKIP}>Aller au contenu</a>
        <SpaceSidebar />
        <div className="flex min-h-screen min-w-0 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
          <SpaceTopBar />
          <VerifyEmailBanner />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
          <footer className="border-t border-white/10 px-4 py-8 text-sm text-white/40 sm:px-8">
            <p className="flex flex-wrap gap-x-6 gap-y-2">
              <span>© {new Date().getFullYear()} LesCracks</span>
              {LEGAL_LINKS.map((link) => <Link key={link.to} to={link.to} className="transition-colors hover:text-white">{link.label}</Link>)}
            </p>
          </footer>
        </div>
        <SpaceTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-geist text-white antialiased">
      <a href="#main-content" className={SKIP}>Aller au contenu</a>
      <SiteHeader items={items} isSignedIn={isSignedIn} nextEvent={nextEvent} />
      <SignupNudge />
      <main id="main-content" tabIndex={-1} className={flush ? 'focus:outline-none' : 'pt-24 focus:outline-none'}>{children}</main>
      <SiteFooter />
    </div>
  );
}
