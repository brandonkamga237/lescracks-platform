import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import MemberAvatar from '@/components/space/MemberAvatar';
import { isTabActive, sidebarGroups } from '@/components/space/spaceTabs';
import { Button } from '@/components/ui/button';
import { COMMUNITY_LINK } from '@/config/site';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

/** Who is reading, at the foot of the sidebar: their account, or the way to open one. */
function SidebarFoot({ member }: { member: boolean }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { name, user, signOut } = useSession();
  const [leaving, setLeaving] = useState(false);
  const back = `?retour=${encodeURIComponent(`${pathname}${search}`)}`;

  if (!member) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Ton espace t’attend.</p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/50">Inscris-toi aux rendez-vous et garde tes attestations au même endroit.</p>
        <Button asChild size="sm" className="mt-4 w-full font-semibold"><Link to={`/inscription${back}`}>Rejoindre</Link></Button>
        <Button asChild size="sm" variant="ghost" className="mt-1 w-full"><Link to={`/connexion${back}`}>Se connecter</Link></Button>
      </div>
    );
  }

  const firstName = user?.firstName || name?.trim().split(/\s+/)[0];

  // Leave a members-only page first: signed out on it, its guard would send the reader to sign in again.
  async function leave() {
    setLeaving(true);
    navigate('/', { replace: true });
    try {
      await signOut();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 p-2">
        <MemberAvatar name={name} avatarUrl={user?.avatarUrl} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{firstName || 'Membre'}</span>
          <span className="block truncate text-xs text-white/45">{user?.email}</span>
        </span>
      </div>
      <button type="button" disabled={leaving} onClick={() => void leave()} className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-full px-4 text-sm text-white/45 transition-colors hover:text-white disabled:opacity-50">
        <LogOut className="h-4 w-4" aria-hidden="true" />{leaving ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
    </>
  );
}

/** The space on a wide screen: the platform's tabs down the side, the reader at the foot. */
export default function SpaceSidebar({ member }: { member: boolean }) {
  const { pathname, hash } = useLocation();

  return (
    <aside className="hidden border-r border-white/10 lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-7">
        <Link to="/" aria-label={member ? 'LesCracks, mon espace' : 'LesCracks, accueil'} className="px-3"><LesCracksLogo height={34} className="w-auto" /></Link>

        <nav aria-label="Navigation principale" className="mt-10 space-y-7">
          {sidebarGroups(member).map((group) => (
            <div key={group.title ?? 'home'}>
              {group.title && <p className="mb-2 px-4 text-xs font-medium text-white/30">{group.title}</p>}
              <ul className="space-y-1">
                {group.tabs.map((tab) => {
                  const active = isTabActive(tab, pathname, hash);
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
            </div>
          ))}
        </nav>

        <a href={COMMUNITY_LINK.href} target="_blank" rel="noopener noreferrer" aria-label="La communauté sur WhatsApp, nouvel onglet" className="mt-6 flex min-h-11 items-center gap-3 border-t border-white/10 px-4 pt-6 text-sm text-white/45 transition-colors hover:text-white">
          <COMMUNITY_LINK.Icon className="h-[18px] w-[18px] shrink-0" />La communauté
        </a>

        <div className="mt-auto border-t border-white/10 pt-5"><SidebarFoot member={member} /></div>
      </div>
    </aside>
  );
}
