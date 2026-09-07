import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, CalendarDays, FolderOpen, Mail, Tags, Users } from 'lucide-react';
import { AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { adminApi } from '@/services/adminApi';

export default function AdminDashboard() {
  const { name } = useSession();
  const overview = useApi((signal) => adminApi.overview(signal), []);
  const stats = overview.data;
  const workspaces = [
    { to: '/admin/ressources', title: 'Le catalogue', description: 'Créer une ressource, reprendre un brouillon ou gérer les publications.', icon: BookOpen },
    { to: '/admin/evenements', title: 'Les prochains rendez-vous', description: 'Préparer un événement et mettre à jour son programme.', icon: CalendarDays },
    { to: '/admin/categories', title: 'Les catégories', description: 'Structurer le catalogue pour faciliter la découverte.', icon: FolderOpen },
    { to: '/admin/tags', title: 'Les tags', description: 'Organiser les sujets à l’intérieur de chaque catégorie.', icon: Tags },
  ];

  return <AdminSection title="Vue d’ensemble" description={`Bonjour${name ? ` ${name}` : ''}. Voici l’état actuel de la plateforme.`} action={<button type="button" onClick={overview.reload} disabled={overview.loading} className="rounded-full border border-line px-5 py-3 text-sm text-t2 hover:bg-card disabled:opacity-50">{overview.loading ? 'Actualisation…' : 'Actualiser'}</button>}>
    <AdminState loading={overview.loading} error={overview.error} empty={!stats} emptyMessage="Les statistiques ne sont pas disponibles." onRetry={overview.reload}>
      {stats && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: 'Ressources', value: stats.resources, icon: BookOpen, detail: `${stats.resourcesByStatus.PUBLISHED ?? 0} publiées`, to: '/admin/ressources' },
            { title: 'Événements', value: stats.events, icon: CalendarDays, detail: `${stats.eventsByStatus.PUBLISHED ?? 0} publiés`, to: '/admin/evenements' },
            { title: 'Membres', value: stats.users, icon: Users, detail: `${stats.usersByStatus.ACTIVE ?? 0} actifs` },
            { title: 'Abonnés newsletter', value: stats.newsletterSubscribers, icon: Mail, detail: `${stats.newsletterUnsubscribed} désabonnés` },
          ].map(({ title, value, icon: Icon, detail, to }) => <div key={title} className="rounded-2xl border border-line-soft bg-card p-6"><div className="flex items-center justify-between gap-2"><p className="text-sm text-t3">{title}</p><Icon className="h-5 w-5 text-gold-400" aria-hidden /></div><p className="mt-6 font-display text-4xl font-semibold tabular-nums">{value.toLocaleString('fr-FR')}</p><p className="mt-2 text-xs text-t4">{detail}</p>{to && <Link to={to} className="mt-5 inline-flex items-center gap-1 text-sm text-gold-400">Gérer<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>}</div>)}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line-soft bg-card p-6"><h2 className="font-display text-lg font-semibold">État du catalogue</h2><dl className="mt-5 grid grid-cols-3 gap-3">{[['Brouillons', stats.resourcesByStatus.DRAFT], ['Publiées', stats.resourcesByStatus.PUBLISHED], ['Archivées', stats.resourcesByStatus.ARCHIVED]].map(([label, count]) => <div key={label}><dt className="text-xs text-t3">{label}</dt><dd className="mt-2 font-display text-2xl tabular-nums">{Number(count ?? 0).toLocaleString('fr-FR')}</dd></div>)}</dl></div>
          <div className="rounded-2xl border border-line-soft bg-card p-6"><h2 className="font-display text-lg font-semibold">État des événements</h2><dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{[['Brouillons', stats.eventsByStatus.DRAFT], ['Publiés', stats.eventsByStatus.PUBLISHED], ['Terminés', stats.eventsByStatus.COMPLETED], ['Annulés', stats.eventsByStatus.CANCELLED]].map(([label, count]) => <div key={label}><dt className="text-xs text-t3">{label}</dt><dd className="mt-2 font-display text-2xl tabular-nums">{Number(count ?? 0).toLocaleString('fr-FR')}</dd></div>)}</dl></div>
        </div>
      </>}
    </AdminState>
    <div className="mb-5 mt-10"><h2 className="font-display text-xl font-semibold">À toi de jouer</h2><p className="mt-1 text-sm text-t3">Un accès direct aux outils du quotidien.</p></div>
    <div className="grid gap-4 md:grid-cols-2">{workspaces.map(({ to, title, description, icon: Icon }) => <Link key={to} to={to} className="group flex gap-4 rounded-2xl border border-line-soft bg-card p-6 transition-colors hover:border-gold-400/40"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-noir-800 text-gold-400"><Icon className="h-5 w-5" aria-hidden /></span><div><h3 className="font-display text-lg font-medium">{title}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-t3">{description}</p></div><ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-t4 group-hover:text-gold-400" aria-hidden /></Link>)}</div>
  </AdminSection>;
}
