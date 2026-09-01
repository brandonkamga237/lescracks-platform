// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, Calendar, TrendingUp, Loader2, Activity, FilePlus, ArrowUpRight, ArrowDownRight, Eye,
  Download, ClipboardList, Zap, Minus,
  Compass, Save, Check,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import adminApi, { DashboardStats, TopResource } from '@/services/adminApi';
import { apiService } from '@/services/api';
import { DEFAULT_360_CLOSED_MESSAGE } from '@/hooks/useProgrammeStatus';
import { catColor, SEQUENTIAL, GRID, AXIS_TICK, ChartTooltip, Card } from '@/components/admin/viz';
import type { LucideIcon } from 'lucide-react';

// ── helpers ─────────────────────────────────────────────────────────────────
const fr = (n: number) => Number(n || 0).toLocaleString('fr-FR');
const pct = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

// ── KPI card (with real MoM trend + optional sparkline) ─────────────────────────
const Kpi = ({
  title, value, icon: Icon, tint, link, trend, hint, spark,
}: {
  title: string; value: string | number; icon: LucideIcon; tint: string;
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
  icon: LucideIcon; title: string; subtitle?: string; tint?: string; action?: React.ReactNode;
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
  rank: number; title: string; type?: string; count: number; icon: LucideIcon; tint: string;
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

// ── Accompagnement 360 availability control ────────────────────────────────────
// The 360 is a paid, occasional offering. This lets an admin open or close it (and
// author the message shown while closed) straight from the dashboard.
const Programme360Control = () => {
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiService.getProgrammeStatus()
      .then((s) => { setOpen(s.open); setMessage(s.message ?? ''); })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await apiService.updateProgrammeStatus({ open, message: message.trim() || null });
      setOpen(res.open);
      setMessage(res.message ?? '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 leading-tight">Accompagnement 360</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ouvrir ou fermer les candidatures. Fermé, les pages publiques masquent « Postuler ».
            </p>
          </div>
        </div>

        {/* Status + toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!loading && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              open ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {open ? 'Ouvert' : 'Fermé'}
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={open}
            aria-label="Basculer la disponibilité de l'Accompagnement 360"
            disabled={loading}
            onClick={() => setOpen((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              open ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${open ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Closed message editor — only relevant while closed */}
      {!loading && !open && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label htmlFor="closed-msg" className="block text-xs font-medium text-gray-500 mb-1.5">
            Message affiché aux visiteurs (facultatif)
          </label>
          <textarea
            id="closed-msg"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={DEFAULT_360_CLOSED_MESSAGE}
            className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 resize-none"
          />
          <p className="text-[11px] text-gray-400 mt-1">Laissé vide, un message par défaut est utilisé.</p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved ? <Check className="w-4 h-4 text-emerald-400" />
            : <Save className="w-4 h-4" />}
          {saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </Card>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
  const ROLE_LABEL: Record<string, string> = { ADMIN: 'Admins', LEARNER: 'Apprenants', FREE: 'Gratuits' };
  const PROVIDER_LABEL: Record<string, string> = { LOCAL: 'Email', GOOGLE: 'Google', GITHUB: 'GitHub' };
  const EVENT_LABEL: Record<string, string> = { OUVERT: 'Ouvert', FERME: 'Fermé', A_VENIR: 'À venir' };
  const entries = (o: Record<string, number> | undefined, lbl?: Record<string, string>) =>
    o ? Object.entries(o).map(([name, value]) => ({ name: lbl?.[name] ?? name, value: Number(value) })) : [];

  const usersByRole = entries(stats?.usersByRole, ROLE_LABEL);
  const usersByProvider = entries(stats?.usersByProvider, PROVIDER_LABEL);
  const resourcesByType = entries(stats?.resourcesByType);
  const resourcesByCategory: { categoryName: string; count: number }[] = stats?.resourcesByCategory || [];
  const eventsByStatus = entries(stats?.eventsByStatus, EVENT_LABEL);
  const applicationsByStatus = entries(stats?.applicationsByStatus);
  const dailyUsers: { date: string; count: number }[] = stats?.dailyNewUsers || [];
  const topViewed: TopResource[] = stats?.topViewedResources || [];
  const topDownloaded: TopResource[] = stats?.topDownloadedResources || [];

  const totalApps = applicationsByStatus.reduce((s, x) => s + x.value, 0);
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

      {/* ── KPI ROW — four figures that matter, one accent (not a six-colour rainbow) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi title="Utilisateurs" value={totalUsers} icon={Users} tint="bg-gold/10 text-gold"
          link="/admin/users" trend={userTrend} hint={`+${stats?.newUsersLast30Days || 0} sur 30 j`} spark={dailyUsers} />
        <Kpi title="Ressources" value={stats?.totalResources || 0} icon={FileText} tint="bg-gold/10 text-gold"
          link="/admin/resources" hint={`+${stats?.newResourcesLast30Days || 0} sur 30 j`} />
        <Kpi title="Événements" value={stats?.totalEvents || 0} icon={Calendar} tint="bg-gold/10 text-gold" link="/admin/events" />
        <Kpi title="Candidatures" value={totalApps} icon={ClipboardList} tint="bg-gold/10 text-gold"
          link="/admin/applications" hint="Toutes confondues" />
      </div>

      {/* ── Accompagnement 360 availability ── */}
      <Programme360Control />

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
                  <Tooltip content={<ChartTooltip labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })} />} />
                  <Area type="monotone" dataKey="count" name="Inscriptions" stroke={SEQUENTIAL} strokeWidth={2} fill="url(#growth)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider mix (a compact list — a 3-bar chart was noise, not insight) + role split */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Par méthode de connexion</p>
              <div className="space-y-1.5">
                {usersByProvider.length ? usersByProvider.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-semibold text-gray-900">
                      {fr(item.value)}
                      <span className="text-gray-400 font-normal ml-1.5">
                        {totalUsers > 0 ? `${Math.round((item.value / totalUsers) * 100)}%` : '0%'}
                      </span>
                    </span>
                  </div>
                )) : <p className="text-sm text-gray-400">Aucune donnée</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              {usersByRole.map((item) => (
                <div key={item.name} className="p-2.5 rounded-xl bg-gray-50">
                  <p className="text-[11px] text-gray-500 truncate">{item.name}</p>
                  <p className="text-lg font-bold mt-0.5 text-gray-900">{fr(item.value)}</p>
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
            {applicationsByStatus.length ? applicationsByStatus.map((item) => (
              <Meter key={item.name} label={item.name} value={item.value} total={totalApps} color={SEQUENTIAL} />
            )) : <p className="text-sm text-gray-400 text-center py-6">Aucune candidature</p>}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">{fr(totalApps)}</p>
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
            {stats?.recentUsers?.length ? stats.recentUsers.map((u) => (
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
            {stats?.recentResources?.length ? stats.recentResources.map((r) => (
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
