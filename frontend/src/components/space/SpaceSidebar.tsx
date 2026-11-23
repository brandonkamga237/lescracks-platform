import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import MemberAvatar from '@/components/space/MemberAvatar';
import { MEMBER_TABS, isTabActive } from '@/components/space/spaceTabs';
import { COMMUNITY_LINK } from '@/config/site';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

/** The member space on a wide screen: the site's tabs down the side, the member at the foot. */
export default function SpaceSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { name, user, signOut } = useSession();
  const [leaving, setLeaving] = useState(false);
  const firstName = user?.firstName || name?.trim().split(/\s+/)[0];
  const onProfile = pathname === '/profil';

  async function leave() {
    setLeaving(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } finally {
      setLeaving(false);
    }
  }

  return (
    <aside className="hidden border-r border-white/10 lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-4 py-7">
        <Link to="/" aria-label="LesCracks, accueil" className="px-3"><LesCracksLogo height={34} className="w-auto" /></Link>

        <nav aria-label="Navigation principale" className="mt-10">
          <ul className="space-y-1">
            {MEMBER_TABS.map((tab) => {
              const active = isTabActive(tab, pathname);
              return (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn('group flex min-h-11 items-center gap-3 rounded-full px-4 text-[15px] transition-colors', active ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white')}
                  >
                    <tab.Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-gold-400' : 'text-white/40 group-hover:text-white/70')} aria-hidden="true" />
                    {tab.label}
                    {tab.soon && <span className="ml-auto rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-medium text-gold-400">Bientôt</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <a href={COMMUNITY_LINK.href} target="_blank" rel="noopener noreferrer" aria-label="La communauté sur WhatsApp, nouvel onglet" className="mt-6 flex min-h-11 items-center gap-3 rounded-full border-t border-white/10 px-4 pt-6 text-sm text-white/45 transition-colors hover:text-white">
          <COMMUNITY_LINK.Icon className="h-[18px] w-[18px] shrink-0" />La communauté
        </a>

        <div className="mt-auto border-t border-white/10 pt-5">
          <Link to="/profil" aria-current={onProfile ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-2xl p-2 transition-colors', onProfile ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]')}>
            <MemberAvatar name={name} avatarUrl={user?.avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{firstName || 'Mon compte'}</span>
              <span className="block truncate text-xs text-white/45">{user && user.completion < 100 ? `Profil complété à ${user.completion} %` : 'Mon compte'}</span>
            </span>
          </Link>
          <button type="button" disabled={leaving} onClick={() => void leave()} className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-full px-4 text-sm text-white/45 transition-colors hover:text-white disabled:opacity-50">
            <LogOut className="h-4 w-4" aria-hidden="true" />{leaving ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    </aside>
  );
}
