import { Link, useLocation } from 'react-router-dom';

import MemberAvatar from '@/components/member/MemberAvatar';
import { MEMBER_SPACES, spaceOf } from '@/components/member/memberSpaces';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

/** The notebook on a phone: the logo and the profile on top, the numbered spaces under the thumb. */
export function MemberTopBar() {
  const { pathname } = useLocation();
  const { name, user } = useSession();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/90 px-4 backdrop-blur-xl lg:hidden">
      <Link to="/" className="flex min-h-11 items-center gap-3 text-[15px] font-medium">
        <span aria-hidden="true" className="tabular-nums text-gold-400">{spaceOf(pathname) ?? '·'}</span>
        {MEMBER_SPACES.find((space) => space.index === spaceOf(pathname))?.label ?? 'LesCracks'}
      </Link>
      <Link to="/profil" aria-label="Mon profil" className="flex min-h-11 min-w-11 items-center justify-end"><MemberAvatar name={name} avatarUrl={user?.avatarUrl} className="h-8 w-8" /></Link>
    </header>
  );
}

export default function MemberTabBar() {
  const { pathname } = useLocation();
  const current = spaceOf(pathname);
  return (
    <nav aria-label="Espaces" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ol className="grid grid-cols-4">
        {MEMBER_SPACES.map((space) => {
          const active = space.index === current;
          return (
            <li key={space.index}>
              <Link to={space.to} aria-current={active ? 'page' : undefined} aria-label={space.label} className={cn('flex min-h-[4.25rem] flex-col items-center justify-center gap-1 transition-colors', active ? 'text-white' : 'text-white/45')}>
                <span aria-hidden="true" className={cn('text-base tabular-nums', active && 'text-gold-400')}>{space.index}</span>
                <span aria-hidden="true" className="text-xs">{space.short}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
