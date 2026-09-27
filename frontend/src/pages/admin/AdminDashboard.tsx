import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Eye, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AdminSection, AdminState } from '@/components/admin/AdminTable';
import { Delta, Kpi, Panel, PeriodSelect, TrendChart, deltaPct } from '@/components/admin/viz';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { adminApi } from '@/services/adminApi';
import { resourcePath, eventPath } from '@/lib/slugs';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type MetricKey = 'visitors' | 'registrations' | 'newsletter';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'visitors', label: 'Visiteurs' },
  { key: 'registrations', label: 'Inscriptions' },
  { key: 'newsletter', label: 'Abonnés' },
];

export default function AdminDashboard() {
  const { name } = useSession();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<MetricKey>('visitors');

  const overview = useApi((signal) => adminApi.overview(signal), []);
  const audience = useApi((signal) => adminApi.audience(days, signal), [days]);
  const views = useApi((signal) => adminApi.contentViews(days, signal), [days]);
  const watch = useApi((signal) => adminApi.watch(signal), []);
  const recent = useApi((signal) => adminApi.users(0, '', signal), []);
  // Double range so each metric can compare with the previous period.
  const growth = useApi((signal) => adminApi.userGrowth(daysAgo(days * 2), daysAgo(0), signal), [days]);
  const letter = useApi((signal) => adminApi.newsletterGrowth(daysAgo(days * 2), daysAgo(0), signal), [days]);

  const stats = overview.data;

  const split = useMemo(() => {
    const points = growth.data?.points ?? [];
    const half = points.length - Math.min(days, points.length);
    const current = points.slice(Math.max(0, half));
    const previous = points.slice(0, Math.max(0, half)).slice(-days);
    return { current, previous };
  }, [growth.data, days]);

  const splitNewsletter = useMemo(() => {
    const points = letter.data?.points ?? [];
    const half = points.length - Math.min(days, points.length);
    const current = points.slice(Math.max(0, half));
    const previous = points.slice(0, Math.max(0, half)).slice(-days);
    return { current, previous };
  }, [letter.data, days]);

  const sum = (points: { count: number }[]) => points.reduce((acc, p) => acc + p.count, 0);

  const chartData = useMemo((): Record<string, number | string>[] => {
    if (metric === 'visitors') {
      return (audience.data?.series ?? []).map((p) => ({ date: p.date, value: p.visits }));
    }
    const pts = metric === 'registrations' ? split.current : splitNewsletter.current;
    return pts.map((p) => ({ date: p.date, value: p.count }));
  }, [metric, audience.data, split, splitNewsletter]);

  const trendDelta = useMemo(() => {
    if (metric === 'visitors') return deltaPct(audience.data?.visits, audience.data?.previousVisits);
    const { current, previous } = metric === 'registrations' ? split : splitNewsletter;
    return deltaPct(sum(current), sum(previous));
  }, [metric, audience.data, split, splitNewsletter]);

  const signals = watch.data?.signals ?? [];
  const today = new Date();

  return (
    <AdminSection
      title="Pilotage"
      description={`Bonjour${name ? ` ${name}` : ''}. Voici ce qui se passe sur LesCracks.`}
      action={<PeriodSelect value={days} onChange={setDays} />}
    >
      {/* ── Où en sommes-nous ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminState loading={audience.loading} error={null} empty={false} emptyMessage="">
          <Kpi
            label={`Visiteurs · ${days} jours`}
            value={audience.data?.available ? (audience.data.visitors ?? 0).toLocaleString('fr-FR') : '—'}
            delta={deltaPct(audience.data?.visitors, audience.data?.previousVisitors)}
            hint={audience.data?.available
              ? `${(audience.data.pageviews ?? 0).toLocaleString('fr-FR')} pages vues`
              : 'Audience indisponible pour le moment.'}
            spark={audience.data?.series.map((p) => ({ date: p.date, value: p.visits }))}
          />
        </AdminState>
        <AdminState loading={overview.loading} error={null} empty={false} emptyMessage="">
          {stats && (
            <Kpi
              label="Membres inscrits"
              value={stats.users.toLocaleString('fr-FR')}
              delta={deltaPct(sum(split.current), sum(split.previous))}
              hint={`${stats.usersActiveLast30d.toLocaleString('fr-FR')} actifs sur 30 jours`}
              spark={split.current.map((p) => ({ date: p.date, value: p.count }))}
            />
          )}
        </AdminState>
        <AdminState loading={overview.loading} error={null} empty={false} emptyMessage="">
          {stats && (
            <Kpi
              label="Abonnés à la lettre"
              value={stats.newsletterSubscribers.toLocaleString('fr-FR')}
              delta={deltaPct(sum(splitNewsletter.current), sum(splitNewsletter.previous))}
              hint={`${stats.newsletterNewLast30d.toLocaleString('fr-FR')} nouveaux sur 30 jours`}
              spark={splitNewsletter.current.map((p) => ({ date: p.date, value: p.count }))}
            />
          )}
        </AdminState>
      </div>

      {/* ── Qu'est-ce qui évolue ──────────────────────────────────────────── */}
      <Panel
        className="mt-6"
        title="Comment ça évolue"
        subtitle="Lecture sur la période choisie, comparée à la précédente."
        action={
          <div className="inline-flex rounded-full border border-line bg-noir-900 p-1" role="group" aria-label="Indicateur">
            {METRICS.map((m) => (
              <button key={m.key} type="button" onClick={() => setMetric(m.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${metric === m.key ? 'bg-gold-400 text-black' : 'text-t3 hover:text-t1'}`}>
                {m.label}
              </button>
            ))}
          </div>
        }
      >
        {metric === 'visitors' && audience.data && !audience.data.available ? (
          <p className="py-16 text-center text-sm text-t3">Les données d’audience ne sont pas encore disponibles.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm text-t3">Sur la période</span>
              {trendDelta != null && <Delta pct={trendDelta} />}
            </div>
            <TrendChart data={chartData} series={[{ key: 'value', name: METRICS.find((m) => m.key === metric)?.label ?? '' }]} height={280} />
          </>
        )}
      </Panel>

      {/* ── Qu'est-ce qui fonctionne ──────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Ce qui attire l’attention" subtitle={`Ressources les plus consultées · ${days} jours`}>
          <AdminState
            loading={views.loading}
            error={views.error}
            empty={!views.data?.resources.length}
            emptyMessage={views.data && !views.data.available
              ? 'Les consultations seront visibles une fois l’audience branchée.'
              : 'Aucune consultation mesurée sur la période.'}
          >
            <ol className="space-y-1">
              {views.data?.resources.slice(0, 6).map((resource) => (
                <li key={resource.id}>
                  <Link to={resourcePath(resource)}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-noir-800">
                    <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-noir-800">
                      {resource.coverImage && <img src={resource.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-t1">{resource.title}</span>
                      {resource.category && <span className="text-xs text-t4">{resource.category}</span>}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-t3">
                      <Eye className="h-3.5 w-3.5" aria-hidden /> {resource.views.toLocaleString('fr-FR')}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </AdminState>
        </Panel>

        <Panel title="Les rendez-vous" subtitle="Prochains événements publiés">
          <AdminState loading={overview.loading} error={null} empty={false} emptyMessage="">
            {stats && (
              <>
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 font-medium text-gold-400">
                    {stats.eventsUpcoming} à venir
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 text-t3">{stats.eventsOngoing} en cours</span>
                  <span className="rounded-full border border-line px-3 py-1 text-t3">{stats.eventsPast} passés</span>
                </div>
                <AdminState loading={views.loading} error={null}
                  empty={!views.data?.events.length}
                  emptyMessage="Aucun événement consulté sur la période.">
                  <ul className="space-y-1">
                    {views.data?.events.slice(0, 5).map((event) => {
                      const upcoming = new Date(event.startDate) > today;
                      return (
                        <li key={event.id}>
                          <Link to={eventPath(event)}
                            className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-noir-800">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-t1">{event.title}</span>
                              <span className="text-xs text-t4">
                                {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                {upcoming ? ' · à venir' : ''}
                              </span>
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-t3">
                              <Eye className="h-3.5 w-3.5" aria-hidden /> {event.views.toLocaleString('fr-FR')}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </AdminState>
              </>
            )}
          </AdminState>
        </Panel>
      </div>

      {/* ── À surveiller ──────────────────────────────────────────────────── */}
      <Panel
        className="mt-6 border-gold-400/15"
        title="À surveiller"
        subtitle="Des signaux d’activité qui méritent peut-être une action."
      >
        <AdminState loading={watch.loading} error={watch.error} empty={!signals.length}
          emptyMessage="Rien à signaler pour le moment — l’activité suit son cours.">
          <ul className="grid gap-3 md:grid-cols-2">
            {signals.map((signal) => (
              <li key={signal.key}
                className={`rounded-2xl border p-5 ${signal.severity === 'warning' ? 'border-gold-400/25 bg-gold-400/[0.04]' : 'border-line-soft bg-noir-900/50'}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${signal.severity === 'warning' ? 'bg-gold-400/15 text-gold-400' : 'bg-noir-800 text-t3'}`}>
                    {signal.severity === 'warning' ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <Info className="h-4 w-4" aria-hidden />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-t1">{signal.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-t3">{signal.detail}</p>
                    {signal.actionTo && (
                      <Link to={signal.actionTo} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-400">
                        {signal.actionLabel} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </AdminState>
      </Panel>

      {/* ── Activité récente & accès ──────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Dernières inscriptions" subtitle="Les nouveaux membres de la communauté">
          <AdminState loading={recent.loading} error={recent.error}
            empty={!recent.data?.content.length} emptyMessage="Aucun membre inscrit pour le moment.">
            <ul className="divide-y divide-line-soft">
              {recent.data?.content.slice(0, 6).map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-noir-800 text-xs font-semibold text-gold-400">
                    {(user.firstName?.[0] ?? '')}{(user.lastName?.[0] ?? '')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-t1">{user.firstName} {user.lastName}</span>
                    <span className="block truncate text-xs text-t4">{user.email}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-t4">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          </AdminState>
          <Link to="/admin/utilisateurs" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-400">
            Tous les utilisateurs <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Panel>

        <Panel title="Le catalogue en bref" subtitle="Ce qui est publié aujourd’hui">
          <AdminState loading={overview.loading} error={overview.error} empty={!stats} emptyMessage="Indisponible.">
            {stats && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {[
                  { label: 'Ressources publiées', value: stats.resourcesByStatus.PUBLISHED ?? 0, to: '/admin/ressources' },
                  { label: 'Épisodes Talk', value: stats.talksPublished, to: '/admin/talks' },
                  { label: 'Événements à venir', value: stats.eventsUpcoming, to: '/admin/evenements' },
                  { label: 'Membres actifs · 7 j', value: stats.usersActiveLast7d, to: '/admin/utilisateurs' },
                  { label: 'Brouillons', value: stats.resourcesByStatus.DRAFT ?? 0, to: '/admin/ressources' },
                  { label: 'Emails vérifiés', value: stats.verifiedUsers, to: '/admin/utilisateurs' },
                ].map(({ label, value, to }) => (
                  <Link key={label} to={to} className="group">
                    <dd className="font-display text-3xl font-semibold tabular-nums text-t1 group-hover:text-gold-400">{value.toLocaleString('fr-FR')}</dd>
                    <dt className="mt-1 text-xs text-t3">{label}</dt>
                  </Link>
                ))}
              </dl>
            )}
          </AdminState>
        </Panel>
      </div>
    </AdminSection>
  );
}
