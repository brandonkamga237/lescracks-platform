// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, Calendar, FolderOpen, Tags, TrendingUp, Loader2, Activity,
  BarChart3, PieChart, UserPlus, FilePlus, ArrowUpRight, ArrowDownRight, Eye,
  Download, Crown, ClipboardList, Zap, Code2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import adminApi, { DashboardStats } from '@/services/adminApi';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  title, value, sub, icon: Icon, color, link, trend, trendLabel,
}: {
  title: string; value: string | number; sub?: string; icon: any;
  color: string; link?: string; trend?: number; trendLabel?: string;
}) => {
  const inner = (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all hover:border-gold/40 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trendLabel && <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>}
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
};

// ── Section header ────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, subtitle, color = 'text-gold', children }: {
  icon: any; title: string; subtitle?: string; color?: string; children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ── Funnel bar ────────────────────────────────────────────────────────────────
const FunnelBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`}
        style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }} />
    </div>
  </div>
);

// ── Top resource row ──────────────────────────────────────────────────────────
const TopRow = ({ rank, title, type, count, icon: Icon, color }: {
  rank: number; title: string; type: string; count: number; icon: any; color: string;
}) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
    <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">
      {rank}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
      <p className="text-xs text-gray-400">{type}</p>
    </div>
    <span className={`flex items-center gap-1 text-sm font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {count.toLocaleString('fr-FR')}
    </span>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <p className="text-gray-500">Chargement des analytics...</p>
      </div>
    );
  }

  // Derived data
  const usersByRole = stats?.usersByRole
    ? Object.entries(stats.usersByRole).map(([name, value]) => ({ name, value })) : [];
  const usersByProvider = stats?.usersByProvider
    ? Object.entries(stats.usersByProvider).map(([name, value]) => ({ name, value })) : [];
  const resourcesByType = stats?.resourcesByType
    ? Object.entries(stats.resourcesByType).map(([name, value]) => ({ name, value })) : [];
  const resourcesByCategory: { categoryName: string; count: number }[] = stats?.resourcesByCategory || [];
  const eventsByStatus = stats?.eventsByStatus
    ? Object.entries(stats.eventsByStatus).map(([name, value]) => ({ name, value })) : [];
  const applicationsByStatus = stats?.applicationsByStatus
    ? Object.entries(stats.applicationsByStatus).map(([name, value]) => ({ name, value })) : [];
  const premiumByStatus = stats?.premiumRequestsByStatus
    ? Object.entries(stats.premiumRequestsByStatus).map(([name, value]) => ({ name, value })) : [];
  const dailyUsers: { date: string; count: number }[] = stats?.dailyUsers || [];
  const topViewed: any[] = stats?.topViewedResources || [];
  const topDownloaded: any[] = stats?.topDownloadedResources || [];

  const totalApps = applicationsByStatus.reduce((s, x) => s + Number(x.value), 0);
  const totalPremiumReqs = stats?.totalPremiumRequests || 0;

  const userGrowth = stats?.totalUsers && stats?.newUsersLast30Days
    ? Math.round((stats.newUsersLast30Days / stats.totalUsers) * 100) : 0;
  const resourceGrowth = stats?.totalResources && stats?.newResourcesLast30Days
    ? Math.round((stats.newResourcesLast30Days / stats.totalResources) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
          <p className="text-gray-500 text-sm mt-0.5">Vue décisionnelle de la plateforme LesCracks</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Mis à jour le</p>
          <p className="text-sm font-medium text-gray-700">
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 1 — KPI OVERVIEW
      ───────────────────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Vue d'ensemble — KPIs clés
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users}
            color="bg-blue-100 text-blue-600" link="/admin/users" trend={userGrowth}
            trendLabel={`+${stats?.newUsersLast30Days || 0} ce mois`} />
          <KpiCard title="Ressources" value={stats?.totalResources || 0} icon={FileText}
            color="bg-amber-100 text-amber-600" link="/admin/resources" trend={resourceGrowth}
            trendLabel={`+${stats?.newResourcesLast30Days || 0} ce mois`} />
          <KpiCard title="Événements" value={stats?.totalEvents || 0} icon={Calendar}
            color="bg-green-100 text-green-600" link="/admin/events" />
          <KpiCard title="Conversion Premium" value={`${stats?.premiumConversionRate || 0}%`} icon={Crown}
            color="bg-yellow-100 text-yellow-600" sub="Utilisateurs premium / total" />
          <KpiCard title="Total Vues" value={stats?.totalViews || 0} icon={Eye}
            color="bg-sky-100 text-sky-600" sub="Cumulé toutes ressources" />
          <KpiCard title="Téléchargements" value={stats?.totalDownloads || 0} icon={Download}
            color="bg-purple-100 text-purple-600" sub="Cumulé toutes ressources" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 2 — ACQUISITION & CROISSANCE
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Section icon={TrendingUp} title="Acquisition & Croissance" subtitle="Nouveaux utilisateurs — 7 derniers jours">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily sparkline */}
            <div>
              <p className="text-xs text-gray-500 mb-3">Inscriptions quotidiennes</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyUsers}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }}
                      tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={d => new Date(d).toLocaleDateString('fr-FR')} />
                    <Area type="monotone" dataKey="count" name="Inscriptions"
                      stroke="#F59E0B" fill="url(#goldGrad)" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Provider breakdown */}
            <div>
              <p className="text-xs text-gray-500 mb-3">Répartition par provider</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByProvider}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Utilisateurs" radius={[4, 4, 0, 0]}>
                      {usersByProvider.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Role breakdown mini KPIs */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            {usersByRole.map((item, i) => (
              <div key={item.name} className="p-3 rounded-xl" style={{ background: `${COLORS[i % COLORS.length]}10` }}>
                <p className="text-xs text-gray-500">{item.name}</p>
                <p className="text-xl font-bold mt-1" style={{ color: COLORS[i % COLORS.length] }}>
                  {Number(item.value).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-gray-400">
                  {stats?.totalUsers > 0 ? Math.round((Number(item.value) / stats.totalUsers) * 100) : 0}% du total
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 3 — CONTENU & ENGAGEMENT
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Section icon={FileText} title="Contenu & Engagement" subtitle="Performance des ressources pédagogiques">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Resources by type */}
            <div>
              <p className="text-xs text-gray-500 mb-3">Par type</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={resourcesByType} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {resourcesByType.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resources by category */}
            <div className="lg:col-span-2">
              <p className="text-xs text-gray-500 mb-3">Par catégorie</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourcesByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="categoryName" type="category" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Ressources" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top resources */}
          <div className="grid md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-500" />Top 5 — Plus vues
              </p>
              {topViewed.length > 0 ? topViewed.map((r, i) => (
                <TopRow key={r.id} rank={i + 1} title={r.title} type={r.type}
                  count={r.viewCount} icon={Eye} color="text-sky-600" />
              )) : <p className="text-sm text-gray-400 py-4 text-center">Aucune donnée</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-purple-500" />Top 5 — Plus téléchargés
              </p>
              {topDownloaded.length > 0 ? topDownloaded.map((r, i) => (
                <TopRow key={r.id} rank={i + 1} title={r.title} type={r.type}
                  count={r.downloadCount} icon={Download} color="text-purple-600" />
              )) : <p className="text-sm text-gray-400 py-4 text-center">Aucune donnée</p>}
            </div>
          </div>
        </Section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 4 — PIPELINE COMMERCIAL
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Application funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Section icon={ClipboardList} title="Funnel Candidatures" subtitle="Pipeline des demandes d'accompagnement" color="text-blue-500">
            <div className="space-y-3 mt-2">
              {applicationsByStatus.map((item, i) => (
                <FunnelBar key={item.name} label={item.name} value={Number(item.value)}
                  total={totalApps} color={
                    i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-green-500' : 'bg-red-400'
                  } />
              ))}
              {applicationsByStatus.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune candidature</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Total candidatures</p>
              <p className="text-lg font-bold text-gray-900">{totalApps}</p>
            </div>
            <Link to="/admin/applications" className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors">
              Voir toutes les candidatures <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Section>
        </div>

        {/* Premium pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Section icon={Crown} title="Pipeline Premium" subtitle="Suivi des demandes d'abonnement" color="text-amber-500">
            <div className="space-y-3 mt-2">
              {premiumByStatus.map((item, i) => (
                <FunnelBar key={item.name} label={item.name} value={Number(item.value)}
                  total={totalPremiumReqs} color={
                    i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-blue-400' : i === 2 ? 'bg-green-500' : 'bg-red-400'
                  } />
              ))}
              {premiumByStatus.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune demande premium</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Total demandes</p>
              <p className="text-lg font-bold text-gray-900">{totalPremiumReqs}</p>
            </div>
            <Link to="/admin/premium-requests" className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors">
              Gérer les demandes <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Section>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 5 — ÉVÉNEMENTS & OPEN SOURCE
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Section icon={Calendar} title="Événements" subtitle="Répartition par statut" color="text-green-500">
            <div className="space-y-2 mt-2">
              {eventsByStatus.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{Number(item.value)}</span>
                </div>
              ))}
              {eventsByStatus.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun événement</p>
              )}
            </div>
          </Section>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Section icon={Zap} title="Actions Rapides" color="text-gold">
            <div className="space-y-2 mt-2">
              {[
                { to: '/admin/resources', icon: FileText, label: 'Nouvelle Ressource', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                { to: '/admin/events', icon: Calendar, label: 'Nouvel Événement', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                { to: '/admin/users', icon: Users, label: 'Gérer Utilisateurs', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { to: '/admin/open-source', icon: Code2, label: 'Projets Open Source', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { to: '/admin/contributors', icon: UserPlus, label: 'Contributeurs', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${color}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                </Link>
              ))}
            </div>
          </Section>
        </div>

        {/* Platform health summary */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gold" />
            <h3 className="font-semibold">Santé de la plateforme</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Conversion premium</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gold">{stats?.premiumConversionRate || 0}%</span>
                <span className="text-xs text-gray-500 mb-1">utilisateurs payants</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full mt-2">
                <div className="h-full bg-gold rounded-full"
                  style={{ width: `${Math.min(stats?.premiumConversionRate || 0, 100)}%` }} />
              </div>
            </div>
            <div className="pt-3 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Catégories</p>
                  <p className="text-xl font-bold">{stats?.totalCategories || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tags</p>
                  <p className="text-xl font-bold">{stats?.totalTags || 0}</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Croissance 30j</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Nouveaux users</span>
                <span className="text-sm font-bold text-green-400">+{stats?.newUsersLast30Days || 0}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-300">Nouvelles ressources</span>
                <span className="text-sm font-bold text-blue-400">+{stats?.newResourcesLast30Days || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 6 — ACTIVITÉ RÉCENTE
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Section icon={Users} title="Derniers inscrits" color="text-blue-500">
            <div className="space-y-2 mt-2">
              {stats?.recentUsers?.length > 0 ? stats.recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gold">
                      {(u.username || u.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.email || u.username}</p>
                    <p className="text-xs text-gray-400">{u.roleName} · {u.providerName}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : ''}
                  </span>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur récent</p>}
            </div>
          </Section>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Section icon={FilePlus} title="Ressources récentes" color="text-gold">
            <div className="space-y-2 mt-2">
              {stats?.recentResources?.length > 0 ? stats.recentResources.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    r.resourceTypeName?.toUpperCase() === 'VIDEO'
                      ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.categoryName} · {r.resourceTypeName?.toUpperCase()}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}
                  </span>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">Aucune ressource récente</p>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
