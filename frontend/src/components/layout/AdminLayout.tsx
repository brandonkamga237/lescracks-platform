import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, BookOpen, CalendarDays, ChevronRight, FolderOpen, LayoutDashboard, LogOut, Mail, Menu, Tags, Users, X } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { useSession } from '@/hooks/useSession';
import { ApiError } from '@/services/http';

/**
 * The back office chrome.
 *
 * Sober on purpose: one person uses this, and every hour spent styling it is an hour not
 * spent on the side that decides whether a beginner stays. Five destinations, no dashboard —
 * a dashboard is a screen you look at instead of doing the work.
 */
const SECTIONS = [
  { to: '/admin', label: 'Vue d’ensemble', group: 'Espace de travail', icon: LayoutDashboard },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', group: 'Espace de travail', icon: Users },
  { to: '/admin/newsletter', label: 'Newsletter', group: 'Espace de travail', icon: Mail },
  { to: '/admin/ressources', label: 'Ressources', group: 'Contenu', icon: BookOpen },
  { to: '/admin/evenements', label: 'Événements', group: 'Contenu', icon: CalendarDays },
  { to: '/admin/categories', label: 'Catégories', group: 'Organisation', icon: FolderOpen },
  { to: '/admin/tags', label: 'Tags', group: 'Organisation', icon: Tags },
] as const;

interface AdminLayoutProps { children: React.ReactNode }
interface WorkspaceNavProps { onNavigate?: () => void }

function WorkspaceNav({ onNavigate }: WorkspaceNavProps) {
  return <nav aria-label="Administration" className="space-y-7">
    {['Espace de travail', 'Contenu', 'Organisation'].map((group) => <div key={group}>
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-t4">{group}</p>
      <div className="space-y-1">{SECTIONS.filter((section) => section.group === group).map(({ to, label, icon: Icon }) => <NavLink key={to} end={to === '/admin'} to={to} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 ${isActive ? 'bg-gold-400/10 font-medium text-gold-400' : 'text-t3 hover:bg-noir-800 hover:text-t1'}`}><Icon className="h-5 w-5" aria-hidden />{label}</NavLink>)}</div>
    </div>)}
  </nav>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { name, email, signOut } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const current = SECTIONS.find((section) => section.to === location.pathname) ?? SECTIONS[0];

  async function logout() {
    setBusy(true);
    setFailure(null);
    try { await signOut(); navigate('/admin/connexion', { replace: true }); }
    catch (error) { setFailure(error instanceof ApiError ? error.message : 'La déconnexion a échoué. Réessaie.'); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-black text-t1 selection:bg-gold-400/30">
    <a href="#admin-content" className="sr-only z-[60] rounded-full bg-gold-400 px-5 py-3 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line-soft bg-noir-900 px-5 py-8 lg:flex">
      <Link to="/admin" aria-label="LesCracks, vue d’ensemble" className="mb-10 px-3"><LesCracksLogo className="h-8 w-auto" /><span className="mt-3 block text-[10px] uppercase tracking-[0.2em] text-t4">Administration</span></Link>
      <WorkspaceNav />
      <Link to="/" className="mt-auto flex items-center justify-between rounded-2xl border border-line-soft px-4 py-3 text-sm text-t3 hover:border-gold-400/40 hover:text-t1">Voir le site public<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
    </aside>
    <div className="lg:pl-64">
      <header className="border-b border-line-soft bg-noir-900/70 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger aria-label="Ouvrir la navigation" className="rounded-2xl border border-line p-3 text-t2 lg:hidden"><Menu className="h-5 w-5" aria-hidden /></Dialog.Trigger>
            <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" /><Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(85vw,20rem)] flex-col overflow-y-auto border-r border-line bg-noir-900 p-6 text-t1">
              <Dialog.Title className="mb-2 pr-8 font-display text-xl">Administration</Dialog.Title><Dialog.Description className="mb-8 text-sm text-t3">L’espace de travail LesCracks.</Dialog.Description>
              <Dialog.Close aria-label="Fermer la navigation" className="absolute right-4 top-5 rounded-full p-2 text-t2"><X className="h-5 w-5" aria-hidden /></Dialog.Close>
              <WorkspaceNav onNavigate={() => setMobileOpen(false)} /><Link to="/" onClick={() => setMobileOpen(false)} className="mt-8 flex items-center gap-2 text-sm text-gold-400">Voir le site public<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
            </Dialog.Content></Dialog.Portal>
          </Dialog.Root>
          <nav aria-label="Fil d’Ariane" className="min-w-0 text-sm"><ol className="flex items-center gap-2"><li className="hidden sm:block"><Link to="/admin" className="text-t4 hover:text-t1">Administration</Link></li><li className="hidden sm:block"><ChevronRight className="h-3 w-3 text-t4" aria-hidden /></li><li aria-current="page" className="truncate text-t2">{current.label}</li></ol></nav>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block"><p className="max-w-48 truncate text-sm font-medium">{name || 'Administrateur'}</p><p className="max-w-48 truncate text-xs text-t4">{email || 'Espace administrateur'}</p></div>
            <span aria-hidden className="hidden h-10 w-10 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-display text-gold-400 sm:flex">{(name || 'A').slice(0, 1).toUpperCase()}</span>
            <button type="button" disabled={busy} onClick={() => void logout()} aria-label={busy ? 'Déconnexion en cours' : 'Se déconnecter'} className="rounded-full border border-line p-3 text-t3 hover:text-gold-400 disabled:opacity-50"><LogOut className="h-4 w-4" aria-hidden /></button>
          </div>
        </div>
        {failure && <p role="alert" className="mx-auto mt-3 max-w-7xl text-sm text-gold-400">{failure}</p>}
      </header>
      <main id="admin-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8 outline-none sm:px-8 sm:py-10">{children}</main>
    </div>
  </div>;
}
