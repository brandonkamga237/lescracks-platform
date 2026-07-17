// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, Calendar, TrendingUp, Loader2, Activity,
  UserPlus, FilePlus, ArrowUpRight, ArrowDownRight, Eye,
  Download, Crown, ClipboardList, Zap, Code2, Minus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area,
} from 'recharts';
import adminApi from '@/services/adminApi';
import { catColor, SEQUENTIAL, GRID, AXIS_TICK, ChartTooltip, Card } from '@/components/admin/viz';

// ── helpers ─────────────────────────────────────────────────────────────────
const fr = (n: number) => Number(n || 0).toLocaleString('fr-FR');
const pct = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

// ── KPI card (with real MoM trend + optional sparkline) ─────────────────────────
const Kpi = ({
  title, value, icon: Icon, tint, link, trend, hint, spark,
}: {
  title: string; value: string | number; icon: any; tint: string;
  link?: string; trend?: number; hint?: string; spark?: { date: string; count: number }[];
}) => {
  const inner = (
    <div className="relative bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gold/40 transition-all group h-full overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-600'
              : trend < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 tracking-tight">
        {typeof value === 'number' ? fr(value) : value}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {spark && spark.length > 1 && (
        <div className="h-8 -mx-1 mt-2 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="kpiSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SEQUENTIAL} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={SEQUENTIAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count" stroke={SEQUENTIAL} strokeWidth={2} fill="url(#kpiSpark)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
  return link ? <Link to={link} className="block h-full">{inner}</Link> : inner;
};

// ── Panel header ────────────────────────────────────────────────────────────────
const PanelHead = ({ icon: Icon, title, subtitle, tint = 'text-gold', action }: {
  icon: any; title: string; subtitle?: string; tint?: string; action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${tint}`} />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ── Horizontal bar row (magnitude, single hue) ──────────────────────────────────
const Meter = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => (
  <div>
    <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
      <span className="text-gray-600 truncate">{label}</span>
      <span className="font-semibold text-gray-900 flex-shrink-0">{fr(value)}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%', background: color }} />
    </div>
  </div>
);

// ── Ranked resource row ─────────────────────────────────────────────────────────
const TopRow = ({ rank, title, type, count, icon: Icon, tint }: {
  rank: number; title: string; type: string; count: number; icon: any; tint: string;
}) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
    <span className="w-6 h-6 rounded-lg bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{rank}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
      <p className="text-xs text-gray-400">{type}</p>
    </div>
    <span className={`flex items-center gap-1 text-sm font-semibold flex-shrink-0 ${tint}`}>
      <Icon className="w-3.5 h-3.5" />{fr(count)}
    </span>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <p className="text-gray-500">Chargement des analytics…</p>
      </div>
    );
  }

  // Prettify raw enum keys into professional French labels.
  const ROLE_LABEL: Record<string, string> = { ADMIN: 'Admins', PREMIUM: 'Premium', LEARNER: 'Apprenants', FREE: 'Gratuits' };
  const PROVIDER_LABEL: Record<string, string> = { LOCAL: 'Email', GOOGLE: 'Google', GITHUB: 'GitHub' };
  const EVENT_LABEL: Record<string, string> = { OUVERT: 'Ouvert', FERME: 'Fermé', A_VENIR: 'À venir' };
  const entries = (o: any, lbl?: Record<string, string>) =>
    o ? Object.entries(o).map(([name, value]) => ({ name: lbl?.[name] ?? name, value: Number(value) })) : [];

  const usersByRole = entries(stats?.usersByRole, ROLE_LABEL);
  const usersByProvider = entries(stats?.usersByProvider, PROVIDER_LABEL);
  const resourcesByType = entries(stats?.resourcesByType);
  const resourcesByCategory: { categoryName: string; count: number }[] = stats?.resourcesByCategory || [];
  const eventsByStatus = entries(stats?.eventsByStatus, EVENT_LABEL);
  const applicationsByStatus = entries(stats?.applicationsByStatus);
  const premiumByStatus = entries(stats?.premiumRequestsByStatus);
  const dailyUsers: { date: string; count: number }[] = stats?.dailyNewUsers || [];
  const topViewed: any[] = stats?.topViewedResources || [];
  const topDownloaded: any[] = stats?.topDownloadedResources || [];

  const totalApps = applicationsByStatus.reduce((s, x) => s + x.value, 0);
  const totalPremiumReqs = stats?.totalPremiumRequests || 0;
  const totalUsers = stats?.totalUsers || 0;

  // Real month-over-month delta.
  const userTrend = pct(stats?.newUsersLast30Days || 0, stats?.newUsersPrev30Days || 0);

  // Engagement efficiency — derived, decision-useful (not vanity counts).
  const totalViews = stats?.totalViews || 0;
  const totalDownloads = stats?.totalDownloads || 0;
  const totalResources = stats?.totalResources || 0;
  const totalTypes = resourcesByType.reduce((s, x) => s + x.value, 0);
  const downloadRate = totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 0;
  const avgViews = totalResources > 0 ? Math.round(totalViews / totalResources) : 0;
  const avgDownloads = totalResources > 0 ? (totalDownloads / totalResources).toFixed(1) : '0';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">Business Intelligence</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Tableau de bord</h2>
          <p className="text-gray-500 text-sm mt-1">Vue décisionnelle de la plateforme LesCracks</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Actualisé le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Kpi title="Utilisateurs" value={totalUsers} icon={Users} tint="bg-blue-100 text-blue-600"
          link="/admin/users" trend={userTrend} hint={`+${stats?.newUsersLast30Days || 0} sur 30 j`} spark={dailyUsers} />
        <Kpi title="Ressources" value={stats?.totalResources || 0} icon={FileText} tint="bg-amber-100 text-amber-600"
          link="/admin/resources" hint={`+${stats?.newResourcesLast30Days || 0} sur 30 j`} />
        <Kpi title="Événements" value={stats?.totalEvents || 0} icon={Calendar} tint="bg-emerald-100 text-emerald-600" link="/admin/events" />
        <Kpi title="Conversion Premium" value={`${stats?.premiumConversionRate || 0}%`} icon={Crown} tint="bg-yellow-100 text-yellow-600" hint="Premium / total" />
        <Kpi title="Vues cumulées" value={stats?.totalViews || 0} icon={Eye} tint="bg-sky-100 text-sky-600" hint="Toutes ressources" />
        <Kpi title="Téléchargements" value={stats?.totalDownloads || 0} icon={Download} tint="bg-violet-100 text-violet-600" hint="Toutes ressources" />
      </div>

      {/* ── ACQUISITION ── */}
      <Card className="p-4 sm:p-6">
        <PanelHead icon={TrendingUp} title="Acquisition & Croissance" subtitle="Nouveaux inscrits — 30 derniers jours" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-xs text-gray-500 mb-3">Inscriptions quotidiennes</p>
            <div className="h-56 sm:h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyUsers} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEQUENTIAL} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={SEQUENTIAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={24}
                    tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} width={28} />
                  <Tooltip content={<ChartTooltip labelFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })} />} />
                  <Area type="monotone" dataKey="count" name="Inscriptions" stroke={SEQUENTIAL} strokeWidth={2} fill="url(#growth)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider mix + role split */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-3">Par méthode de connexion</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByProvider} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#00000008' }} content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Utilisateurs" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {usersByProvider.map((_, i) => <Cell key={i} fill={catColor(i)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              {usersByRole.map((item, i) => (
                <div key={item.name} className="p-2.5 rounded-xl" style={{ background: `${catColor(i)}12` }}>
                  <p className="text-[11px] text-gray-500 truncate">{item.name}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: catColor(i) }}>{fr(item.value)}</p>
                  <p className="text-[11px] text-gray-400">{totalUsers > 0 ? Math.round((item.value / totalUsers) * 100) : 0}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── CONTENT & ENGAGEMENT ── */}
      <Card className="p-4 sm:p-6">
        <PanelHead icon={FileText} title="Contenu & Engagement" subtitle="Performance des ressources pédagogiques" tint="text-amber-500" />
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Engagement efficiency — derived metrics + type split */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-sky-50">
                <p className="text-[11px] text-gray-500 leading-tight">Taux de téléch.</p>
                <p className="text-xl font-bold text-sky-600 mt-1">{downloadRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <p className="text-[11px] text-gray-500 leading-tight">Vues / ress.</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{fr(avgViews)}</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-50">
                <p className="text-[11px] text-gray-500 leading-tight">Téléch. / ress.</p>
                <p className="text-xl font-bold text-violet-600 mt-1">{avgDownloads}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Répartition par type</p>
              {totalTypes > 0 ? (
                <>
                  <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100 gap-0.5">
                    {resourcesByType.map((t, i) => (
                      <div key={t.name} style={{ width: `${(t.value / totalTypes) * 100}%`, background: catColor(i) }}
                        title={`${t.name} : ${t.value}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {resourcesByType.map((t, i) => (
                      <span key={t.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: catColor(i) }} />
                        {t.name} · <span className="font-semibold text-gray-900">{fr(t.value)}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-gray-400 py-4 text-center">Aucune ressource</p>}
            </div>
          </div>
          {/* By category — single hue, magnitude */}
          <div className="lg:col-span-2">
            <p className="text-xs text-gray-500 mb-3">Par catégorie</p>
            <div className="h-52 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourcesByCategory} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                  <YAxis dataKey="categoryName" type="category" width={96} tickLine={false} axisLine={false} tick={{ ...AXIS_TICK, fill: '#475569' }} />
                  <Tooltip cursor={{ fill: '#00000008' }} content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Ressources" fill={SEQUENTIAL} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-500" />Top — Plus vues
            </p>
            {topViewed.length ? topViewed.map((r, i) => (
              <TopRow key={r.id} rank={i + 1} title={r.title} type={r.type} count={r.viewCount} icon={Eye} tint="text-sky-600" />
            )) : <p className="text-sm text-gray-400 py-6 text-center">Aucune donnée</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-violet-500" />Top — Plus téléchargées
            </p>
            {topDownloaded.length ? topDownloaded.map((r, i) => (
              <TopRow key={r.id} rank={i + 1} title={r.title} type={r.type} count={r.downloadCount} icon={Download} tint="text-violet-600" />
            )) : <p className="text-sm text-gray-400 py-6 text-center">Aucune donnée</p>}
          </div>
        </div>
      </Card>

      {/* ── PIPELINES ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6">
          <PanelHead icon={ClipboardList} title="Candidatures" subtitle="Accompagnement 360, événements & archives" tint="text-blue-500"
            action={<Link to="/admin/applications" className="text-xs text-gold hover:text-gold/80 flex items-center gap-1 flex-shrink-0">Voir <ArrowUpRight className="w-3 h-3" /></Link>} />
          <div className="space-y-3 mt-1">
            {applicationsByStatus.length ? applicationsByStatus.map((item, i) => (
              <Meter key={item.name} label={item.name} value={item.value} total={totalApps} color={catColor(i)} />
            )) : <p className="text-sm text-gray-400 text-center py-6">Aucune candidature</p>}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">{fr(totalApps)}</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <PanelHead icon={Crown} title="Demandes Premium" subtitle="Suivi des demandes d'abonnement" tint="text-amber-500"
            action={<Link to="/admin/premium-requests" className="text-xs text-gold hover:text-gold/80 flex items-center gap-1 flex-shrink-0">Gérer <ArrowUpRight className="w-3 h-3" /></Link>} />
          <div className="space-y-3 mt-1">
            {premiumByStatus.length ? premiumByStatus.map((item, i) => (
              <Meter key={item.name} label={item.name} value={item.value} total={totalPremiumReqs} color={catColor(i)} />
            )) : <p className="text-sm text-gray-400 text-center py-6">Aucune demande premium</p>}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">{fr(totalPremiumReqs)}</p>
          </div>
        </Card>
      </div>

      {/* ── EVENTS / ACTIONS / HEALTH ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 sm:p-6">
          <PanelHead icon={Calendar} title="Événements" subtitle="Répartition par statut" tint="text-emerald-500" />
          <div className="space-y-2 mt-1">
            {eventsByStatus.length ? eventsByStatus.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catColor(i) }} />
                  <span className="text-sm text-gray-700 truncate">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{fr(item.value)}</span>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-6">Aucun événement</p>}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <PanelHead icon={Zap} title="Actions rapides" />
          <div className="space-y-2 mt-1">
            {[
              { to: '/admin/resources', icon: FileText, label: 'Nouvelle ressource', c: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              { to: '/admin/events', icon: Calendar, label: 'Nouvel événement', c: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { to: '/admin/users', icon: Users, label: 'Gérer les utilisateurs', c: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { to: '/admin/open-source', icon: Code2, label: 'Projets open source', c: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
              { to: '/admin/contributors', icon: UserPlus, label: 'Contributeurs', c: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
            ].map(({ to, icon: Icon, label, c }) => (
              <Link key={to} to={to} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${c}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-60 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 sm:p-6 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gold" />
            <h3 className="font-semibold">Santé de la plateforme</h3>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Conversion premium</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gold">{stats?.premiumConversionRate || 0}%</span>
              <span className="text-xs text-gray-500 mb-1">utilisateurs payants</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min(stats?.premiumConversionRate || 0, 100)}%` }} />
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Taux de téléchargement</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-sky-400">{downloadRate}%</span>
              <span className="text-xs text-gray-500 mb-1">des vues → téléchargement</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-gray-700">
            <div><p className="text-xs text-gray-400">Catégories</p><p className="text-xl font-bold">{fr(stats?.totalCategories || 0)}</p></div>
            <div><p className="text-xs text-gray-400">Tags</p><p className="text-xl font-bold">{fr(stats?.totalTags || 0)}</p></div>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-700 space-y-1.5">
            <p className="text-xs text-gray-400 mb-1">Croissance 30 j</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Nouveaux utilisateurs</span>
              <span className="font-bold text-emerald-400">+{fr(stats?.newUsersLast30Days || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Nouvelles ressources</span>
              <span className="font-bold text-blue-400">+{fr(stats?.newResourcesLast30Days || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6">
          <PanelHead icon={Users} title="Derniers inscrits" tint="text-blue-500" />
          <div className="space-y-1 mt-1">
            {stats?.recentUsers?.length ? stats.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gold">{(u.username || u.email || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.email || u.username}</p>
                  <p className="text-xs text-gray-400 truncate">{u.roleName} · {u.providerName}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : ''}</span>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-6">Aucun utilisateur récent</p>}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <PanelHead icon={FilePlus} title="Ressources récentes" />
          <div className="space-y-1 mt-1">
            {stats?.recentResources?.length ? stats.recentResources.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  r.resourceTypeName?.toUpperCase() === 'VIDEO' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.categoryName} · {r.resourceTypeName?.toUpperCase()}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}</span>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-6">Aucune ressource récente</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
