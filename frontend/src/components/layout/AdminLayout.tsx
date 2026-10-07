import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, CalendarDays, ChevronRight, FolderOpen, Globe2, LayoutDashboard, LogOut, Mail, MoreHorizontal, Podcast, Shield, Tags, Users } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/hooks/useSession';
import { ApiError } from '@/services/http';

/**
 * The back office chrome.
 *
 * Sober on purpose: one person uses this, and every hour spent styling it is an hour not
 * spent on the side that decides whether a beginner stays.
 */
const SECTIONS = [
  { to: '/admin', label: 'Pilotage', group: 'Espace de travail', icon: LayoutDashboard },
  { to: '/admin/audience', label: 'Audience', group: 'Espace de travail', icon: Globe2 },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', group: 'Espace de travail', icon: Users },
  { to: '/admin/newsletter', label: 'Newsletter', group: 'Espace de travail', icon: Mail },
  { to: '/admin/ressources', label: 'Ressources', group: 'Contenu', icon: BookOpen },
  { to: '/admin/evenements', label: 'Événements', group: 'Contenu', icon: CalendarDays },
  { to: '/admin/talks', label: 'Talk', group: 'Contenu', icon: Podcast },
  { to: '/admin/categories', label: 'Catégories', group: 'Organisation', icon: FolderOpen },
  { to: '/admin/tags', label: 'Tags', group: 'Organisation', icon: Tags },
  { to: '/admin/admins', label: 'Administrateurs', group: 'Sécurité', icon: Shield },
] as const;

/** The daily work on a phone: everything else waits behind « Plus ». */
const PHONE_TABS = ['/admin', '/admin/ressources', '/admin/evenements'] as const;

const TAB_ITEM = 'flex min-h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400';

interface AdminLayoutProps { children: React.ReactNode }
interface WorkspaceNavProps { onNavigate?: () => void }

function WorkspaceNav({ onNavigate }: WorkspaceNavProps) {
  return <nav aria-label="Administration" className="space-y-6">
    {['Espace de travail', 'Contenu', 'Organisation', 'Sécurité'].map((group) => <div key={group}>
      <p className="label mb-2 px-3">{group}</p>
      <div className="space-y-0.5">{SECTIONS.filter((section) => section.group === group).map(({ to, label, icon: Icon }) => <NavLink key={to} end={to === '/admin'} to={to} onClick={onNavigate} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 ${isActive ? 'bg-noir-800 font-semibold text-gold-ink' : 'text-t3 hover:bg-noir-800 hover:text-t1'}`}><Icon className="h-[18px] w-[18px]" aria-hidden />{label}</NavLink>)}</div>
    </div>)}
  </nav>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { name, email, signOut } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const current = SECTIONS.find((section) => section.to === location.pathname) ?? SECTIONS[0];
  const moreActive = moreOpen || !PHONE_TABS.some((to) => to === current.to);
  const initial = (name || 'A').slice(0, 1).toUpperCase();

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  async function logout() {
    setBusy(true);
    setFailure(null);
    try { await signOut(); navigate('/admin/connexion', { replace: true }); }
    catch (error) { setFailure(error instanceof ApiError ? error.message : 'La déconnexion a échoué. Réessaie.'); }
    finally { setBusy(false); }
  }

  return <div className="min-h-[100dvh] bg-black pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-t1 selection:bg-gold-400/30 lg:pb-0">
    <a href="#admin-content" className="sr-only z-[60] rounded bg-gold-400 px-5 py-3 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line-soft bg-noir-900 px-5 py-8 lg:flex">
      <Link to="/admin" aria-label="LesCracks, vue d’ensemble" className="mb-10 px-3"><LesCracksLogo className="h-8 w-auto" /><span className="label mt-3 block">Administration</span></Link>
      <WorkspaceNav />
      <Link to="/" className="mt-auto flex min-h-11 items-center justify-between rounded border border-line-soft px-4 text-sm text-t3 transition-colors hover:border-gold-400/40 hover:text-t1">Voir le site public<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
    </aside>
    <div className="lg:pl-64">
      <header className="mode-raised sticky top-0 z-30 border-b border-line-soft px-4 sm:px-8">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 lg:h-16">
          <Link to="/admin" aria-label="LesCracks, vue d’ensemble" className="shrink-0 lg:hidden"><LesCracksLogo height={28} className="w-auto" /></Link>
          <nav aria-label="Fil d’Ariane" className="min-w-0 text-sm"><ol className="flex items-center gap-2"><li className="hidden lg:block"><Link to="/admin" className="text-t4 transition-colors hover:text-t1">Administration</Link></li><li className="hidden lg:block"><ChevronRight className="h-3 w-3 text-t4" aria-hidden /></li><li aria-current="page" className="truncate font-medium text-t2">{current.label}</li></ol></nav>
          <div className="ml-auto hidden min-w-0 items-center gap-3 lg:flex">
            <div className="min-w-0 text-right"><p className="max-w-48 truncate text-sm font-medium">{name || 'Administrateur'}</p><p className="max-w-48 truncate text-xs text-t4">{email || 'Espace administrateur'}</p></div>
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-display text-gold-ink">{initial}</span>
            <button type="button" disabled={busy} onClick={() => void logout()} aria-label={busy ? 'Déconnexion en cours' : 'Se déconnecter'} className="flex h-10 w-10 items-center justify-center rounded border border-line text-t3 transition-colors hover:text-gold-ink disabled:opacity-50"><LogOut className="h-4 w-4" aria-hidden /></button>
          </div>
        </div>
        {failure && <p role="alert" className="mx-auto mb-3 max-w-7xl text-sm text-error-ink">{failure}</p>}
      </header>
      <main id="admin-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8 outline-none sm:px-8 sm:py-10">{children}</main>
    </div>

    <nav aria-label="Administration, raccourcis" className="mode-raised fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-4">
        {PHONE_TABS.map((to) => {
          const { label, icon: Icon } = SECTIONS.find((section) => section.to === to)!;
          return <li key={to}><NavLink to={to} end={to === '/admin'} className={({ isActive }) => `${TAB_ITEM} ${isActive ? 'text-gold-ink' : 'text-t3'}`}><Icon className="h-5 w-5" aria-hidden />{label}</NavLink></li>;
        })}
        <li>
          <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
            <DialogTrigger asChild>
              <button type="button" className={`${TAB_ITEM} ${moreActive ? 'text-gold-ink' : 'text-t3'}`}><MoreHorizontal className="h-5 w-5" aria-hidden />Plus</button>
            </DialogTrigger>
            <DialogContent position="bottom" className="mode-raised border-line bg-card">
              <div className="flex items-center gap-3 pr-8">
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-display text-gold-ink">{initial}</span>
                <div className="min-w-0">
                  <DialogTitle className="truncate font-display text-lg font-bold text-t1">{name || 'Administrateur'}</DialogTitle>
                  <DialogDescription className="truncate text-sm text-t3">{email || 'Espace administrateur'}</DialogDescription>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/" className="btn-secondary">Voir le site<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
                <button type="button" disabled={busy} onClick={() => void logout()} className="btn-secondary text-t3"><LogOut className="h-4 w-4" aria-hidden />{busy ? 'Déconnexion…' : 'Se déconnecter'}</button>
              </div>
              {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
              <div className="border-t border-line-soft pt-4"><WorkspaceNav onNavigate={() => setMoreOpen(false)} /></div>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </nav>
  </div>;
}
