import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import MemberAvatar from '@/components/member/MemberAvatar';
import { MEMBER_SPACES, spaceOf } from '@/components/member/memberSpaces';
import { COMMUNITY_URL } from '@/config/site';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

const ASIDE_LINKS = [
  { label: 'Le Talk', to: '/talk' },
  { label: 'À propos', to: '/a-propos' },
];

/** The notebook's spine on a wide screen: the numbered spaces, then who is reading. */
export default function MemberSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { name, user, signOut } = useSession();
  const [leaving, setLeaving] = useState(false);
  const current = spaceOf(pathname);
  const firstName = user?.firstName || name?.trim().split(/\s+/)[0];

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
      <div className="sticky top-0 flex h-screen flex-col px-5 py-7">
        <Link to="/" aria-label="LesCracks, mon carnet" className="px-3"><LesCracksLogo height={34} className="w-auto" /></Link>

        <nav aria-label="Espaces" className="mt-12">
          <ol className="space-y-1">
            {MEMBER_SPACES.map((space) => {
              const active = space.index === current;
              return (
                <li key={space.index}>
                  <Link
                    to={space.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn('group flex min-h-11 items-center gap-4 rounded-full px-4 text-[15px] transition-colors', active ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.03] hover:text-white')}
                  >
                    <span aria-hidden="true" className={cn('w-3 text-sm tabular-nums', active ? 'text-gold-400' : 'text-white/30 group-hover:text-gold-400')}>{space.index}</span>
                    {space.label}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>

        <ul className="mt-8 space-y-1 border-t border-white/10 pt-6 text-sm">
          {ASIDE_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} aria-current={pathname.startsWith(link.to) ? 'page' : undefined} className={cn('flex min-h-10 items-center rounded-full px-4 transition-colors', pathname.startsWith(link.to) ? 'text-white' : 'text-white/45 hover:text-white')}>{link.label}</Link>
            </li>
          ))}
          <li><a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" aria-label="La communauté sur WhatsApp, nouvel onglet" className="flex min-h-10 items-center rounded-full px-4 text-white/45 transition-colors hover:text-white">La communauté</a></li>
        </ul>

        <div className="mt-auto border-t border-white/10 pt-5">
          <Link to="/profil" aria-current={pathname === '/profil' ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-2xl p-2 transition-colors', pathname === '/profil' ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]')}>
            <MemberAvatar name={name} avatarUrl={user?.avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{firstName || 'Mon profil'}</span>
              <span className="block truncate text-xs text-white/45">{user && user.completion < 100 ? `Profil complété à ${user.completion} %` : 'Mon profil'}</span>
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
