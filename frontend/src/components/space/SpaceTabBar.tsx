import { Link, useLocation } from 'react-router-dom';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import MemberAvatar from '@/components/space/MemberAvatar';
import { isTabActive, tabsFor } from '@/components/space/spaceTabs';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

/** The space on a phone: the logo on top, with the account or the way in. */
export function SpaceTopBar({ member }: { member: boolean }) {
  const { pathname, search } = useLocation();
  const { name, user } = useSession();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/90 px-4 backdrop-blur-xl lg:hidden">
      <Link to="/" aria-label={member ? 'LesCracks, mon espace' : 'LesCracks, accueil'} className="flex min-h-11 items-center"><LesCracksLogo height={30} className="w-auto" /></Link>
      {member
        ? <Link to="/profil" aria-label="Mon compte" className="flex min-h-11 min-w-11 items-center justify-end"><MemberAvatar name={name} avatarUrl={user?.avatarUrl} className="h-8 w-8" /></Link>
        : <Link to={`/connexion?retour=${encodeURIComponent(`${pathname}${search}`)}`} className="flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-gold-400">Se connecter</Link>}
    </header>
  );
}

/** The platform's tabs under the thumb. Colour change only: a bar touched all day should not move. */
export default function SpaceTabBar({ member }: { member: boolean }) {
  const { pathname } = useLocation();
  const tabs = tabsFor(member);
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className={cn('grid', tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}>
        {tabs.map((tab) => {
          const active = isTabActive(tab, pathname);
          return (
            <li key={tab.to}>
              <Link to={tab.to} aria-current={active ? 'page' : undefined} className={cn('flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', active ? 'text-white' : 'text-white/45')}>
                <tab.Icon className={cn('h-5 w-5', active && 'text-gold-400')} aria-hidden="true" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
