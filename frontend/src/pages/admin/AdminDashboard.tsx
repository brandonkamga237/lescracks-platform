import { useState } from 'react';
import { ArrowUpRight, BookOpen, CalendarDays, Download, FolderOpen, Mail, Tags, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { adminApi } from '@/services/adminApi';

const LINKS = [
  { to: '/admin/ressources', title: 'Le catalogue', description: 'Créer une ressource, reprendre un brouillon ou gérer les publications.', icon: BookOpen },
  { to: '/admin/evenements', title: 'Les prochains rendez-vous', description: 'Préparer un événement et mettre à jour son programme.', icon: CalendarDays },
  { to: '/admin/categories', title: 'Les catégories', description: 'Structurer le catalogue pour faciliter la découverte.', icon: FolderOpen },
  { to: '/admin/tags', title: 'Les tags', description: 'Organiser les sujets à l’intérieur de chaque catégorie.', icon: Tags },
] as const;

const statusLabels = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function UserGrowthChart({ points }: { points: { date: string; count: number }[] }) {
  if (points.length < 2) return <p className="py-8 text-center text-sm text-t3">Pas assez de données.</p>;
  const max = Math.max(...points.map((p) => p.count), 1);
  return (
    <div className="mt-5 flex h-40 items-end gap-1">
      {points.map((point) => (
        <div key={point.date} className="group relative flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-gold-400/60 transition hover:bg-gold-400"
            style={{ height: `${(point.count / max) * 100}%` }}
            aria-label={`${point.date}: ${point.count}`}
          />
          <span className="text-[9px] text-t4">{point.date.slice(5)}</span>
          <span className="absolute bottom-full mb-1 hidden rounded bg-noir-950 px-2 py-1 text-xs text-t1 group-hover:block">
            {point.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { name } = useSession();
  const overview = useApi((signal) => adminApi.overview(signal), []);
  const stats = overview.data;
  const [growthDays, setGrowthDays] = useState(30);
  const from = daysAgo(growthDays);
  const to = daysAgo(0);
  const growth = useApi((signal) => adminApi.userGrowth(from, to, signal), [from, to]);
  const top = useApi((signal) => adminApi.topResources(5, signal), []);

  return <AdminSection title="Vue d’ensemble" description={`Bonjour${name ? ` ${name}` : ''}. Voici l’état actuel de la plateforme.`} action={<div className="flex gap-2"><button type="button" onClick={() => { void overview.reload(); void growth.reload(); void top.reload(); }} disabled={overview.loading} className="rounded-full border border-line px-5 py-3 text-sm text-t2 hover:bg-card disabled:opacity-50">{overview.loading ? 'Actualisation…' : 'Actualiser'}</button><button type="button" onClick={() => void adminApi.exportUsers()} className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 px-4 py-3 text-sm text-gold-400 hover:bg-gold-400/10"><Download className="h-4 w-4" aria-hidden /> Utilisateurs CSV</button></div>}>
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
          <div className="rounded-2xl border border-line-soft bg-card p-6">
            <h2 className="font-display text-lg font-semibold">État du catalogue</h2>
            <dl className="mt-5 grid grid-cols-3 gap-3">
              {Object.entries(stats.resourcesByStatus).map(([status, count]) => (
                <div key={status}>
                  <dt className="text-xs text-t3">{statusLabels[status as keyof typeof statusLabels] ?? status}</dt>
                  <dd className="mt-2 font-display text-2xl tabular-nums">{Number(count ?? 0).toLocaleString('fr-FR')}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-line-soft bg-card p-6">
            <h2 className="font-display text-lg font-semibold">État des événements</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(stats.eventsByStatus).map(([status, count]) => (
                <div key={status}>
                  <dt className="text-xs text-t3">{status}</dt>
                  <dd className="mt-2 font-display text-2xl tabular-nums">{Number(count ?? 0).toLocaleString('fr-FR')}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line-soft bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Croissance des inscriptions</h2>
              <select value={growthDays} onChange={(e) => setGrowthDays(Number(e.target.value))} className="rounded-lg border border-line-strong bg-background px-2 py-1 text-sm text-t1 outline-none">
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
              </select>
            </div>
            <AdminState loading={growth.loading} error={growth.error} empty={!growth.data?.points.length} emptyMessage="Aucune inscription sur la période.">
              {growth.data && <UserGrowthChart points={growth.data.points} />}
            </AdminState>
          </div>

          <div className="rounded-2xl border border-line-soft bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Ressources les plus aimées</h2>
            <AdminState loading={top.loading} error={top.error} empty={!top.data?.resources.length} emptyMessage="Aucun coup de cœur pour le moment.">
              {top.data && <ol className="mt-5 space-y-3">{top.data.resources.map((resource, index) => (
                <li key={resource.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-noir-800 text-xs font-medium text-gold-400">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-t1">{resource.title}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-t3"><TrendingUp className="h-3 w-3" aria-hidden /> {resource.likes}</span>
                </li>
              ))}</ol>}
            </AdminState>
          </div>
        </div>
      </>}
    </AdminState>

    <div className="mb-5 mt-10"><h2 className="font-display text-xl font-semibold">À toi de jouer</h2><p className="mt-1 text-sm text-t3">Un accès direct aux outils du quotidien.</p></div>
    <div className="grid gap-4 md:grid-cols-2">{LINKS.map(({ to, title, description, icon: Icon }) => <Link key={to} to={to} className="group flex gap-4 rounded-2xl border border-line-soft bg-card p-6 transition-colors hover:border-gold-400/40"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-noir-800 text-gold-400"><Icon className="h-5 w-5" aria-hidden /></span><div><h3 className="font-display text-lg font-medium">{title}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-t3">{description}</p></div><ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-t4 group-hover:text-gold-400" aria-hidden /></Link>)}</div>
  </AdminSection>;
}
