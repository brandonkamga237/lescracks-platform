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
    <div className="relative bg-surface-1 rounded-xl p-4 sm:p-5 border border-line hover:border-line-strong hover:border-gold/40 transition-all group h-full overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-data font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-success-subtle text-success'
              : trend < 0 ? 'bg-error-subtle text-error' : 'bg-surface-2 text-t3'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-title sm:text-title text-t1 mt-3 tracking-tight">
        {typeof value === 'number' ? fr(value) : value}
      </p>
      <p className="text-data text-t3 mt-0.5">{title}</p>
      {hint && <p className="text-data text-t4 mt-1">{hint}</p>}
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
      <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${tint}`} />
      </div>
      <div className="min-w-0">
        <h3 className="text-heading text-t1 leading-tight">{title}</h3>
        {subtitle && <p className="text-data text-t3 truncate">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ── Horizontal bar row (magnitude, single hue) ──────────────────────────────────
const Meter = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => (
  <div>
    <div className="flex justify-between items-baseline text-data mb-1 gap-2">
      <span className="text-t3 truncate">{label}</span>
      <span className="font-semibold text-t1 flex-shrink-0">{fr(value)}</span>
    </div>
    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%', background: color }} />
    </div>
  </div>
);

// ── Ranked resource row ─────────────────────────────────────────────────────────
const TopRow = ({ rank, title, type, count, icon: Icon, tint }: {
  rank: number; title: string; type?: string; count: number; icon: LucideIcon; tint: string;
}) => (
  <div className="flex items-center gap-3 py-2 border-b border-line-soft last:border-0">
    <span className="w-6 h-6 rounded-lg bg-surface-2 text-data font-medium text-t3 flex items-center justify-center flex-shrink-0">{rank}</span>
    <div className="flex-1 min-w-0">
      <p className="text-data font-medium text-t1 truncate">{title}</p>
      <p className="text-data text-t4">{type}</p>
    </div>
    <span className={`flex items-center gap-1 text-data font-medium flex-shrink-0 ${tint}`}>
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
            <h3 className="text-heading text-t1 leading-tight">Accompagnement 360</h3>
            <p className="text-data text-t3 mt-0.5">
              Ouvrir ou fermer les candidatures. Fermé, les pages publiques masquent « Postuler ».
            </p>
          </div>
        </div>

        {/* Status + toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!loading && (
            <span className={`inline-flex items-center gap-1.5 text-data font-medium px-2.5 py-1 rounded-full ${
              open ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-success' : 'bg-warning'}`} />
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
              open ? 'bg-success' : 'bg-t4'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-1 shadow transition-transform ${open ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Closed message editor — only relevant while closed */}
      {!loading && !open && (
        <div className="mt-4 pt-4 border-t border-line-soft">
          <label htmlFor="closed-msg" className="block text-data font-medium text-t3 mb-1.5">
            Message affiché aux visiteurs (facultatif)
          </label>
          <textarea
            id="closed-msg"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={DEFAULT_360_CLOSED_MESSAGE}
            className="w-full text-data rounded-xl border border-line px-3 py-2 text-t1 placeholder:text-t4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 resize-none"
          />
          <p className="text-label text-t4 mt-1">Laissé vide, un message par défaut est utilisé.</p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-3 text-t1 text-data font-medium hover:bg-surface-2 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved ? <Check className="w-4 h-4 text-success" />
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
        <p className="text-t3">Chargement des analytics…</p>
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
          <p className="text-data font-medium uppercase tracking-wider text-gold mb-1">Business Intelligence</p>
          <h2 className="text-title sm:text-title text-t1 tracking-tight">Tableau de bord</h2>
          <p className="text-t3 text-data mt-1">Vue décisionnelle de la plateforme LesCracks</p>
        </div>
        <div className="flex items-center gap-2 text-data text-t3 bg-surface-1 border border-line rounded-xl px-3 py-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
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
            <p className="text-data text-t3 mb-3">Inscriptions quotidiennes</p>
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
              <p className="text-data text-t3 mb-2">Par méthode de connexion</p>
              <div className="space-y-1.5">
                {usersByProvider.length ? usersByProvider.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-data">
                    <span className="text-t3">{item.name}</span>
                    <span className="font-semibold text-t1">
                      {fr(item.value)}
                      <span className="text-t4 font-normal ml-1.5">
                        {totalUsers > 0 ? `${Math.round((item.value / totalUsers) * 100)}%` : '0%'}
                      </span>
                    </span>
                  </div>
                )) : <p className="text-data text-t4">Aucune donnée</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-line-soft">
              {usersByRole.map((item) => (
                <div key={item.name} className="p-2.5 rounded-xl bg-surface-2">
                  <p className="text-label text-t3 truncate">{item.name}</p>
                  <p className="text-heading mt-0.5 text-t1">{fr(item.value)}</p>
                  <p className="text-label text-t4">{totalUsers > 0 ? Math.round((item.value / totalUsers) * 100) : 0}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── CONTENT & ENGAGEMENT ── */}
      <Card className="p-4 sm:p-6">
        <PanelHead icon={FileText} title="Contenu & Engagement" subtitle="Performance des ressources pédagogiques" tint="text-warning" />
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Engagement efficiency — derived metrics + type split */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-info-subtle">
                <p className="text-label text-t3 leading-tight">Taux de téléch.</p>
                <p className="text-title text-info mt-1">{downloadRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-info-subtle">
                <p className="text-label text-t3 leading-tight">Vues / ress.</p>
                <p className="text-title text-info mt-1">{fr(avgViews)}</p>
              </div>
              <div className="p-3 rounded-xl bg-info-subtle">
                <p className="text-label text-t3 leading-tight">Téléch. / ress.</p>
                <p className="text-title text-info mt-1">{avgDownloads}</p>
              </div>
            </div>
            <div>
              <p className="text-data text-t3 mb-2">Répartition par type</p>
              {totalTypes > 0 ? (
                <>
                  <div className="flex h-8 rounded-lg overflow-hidden bg-surface-2 gap-0.5">
                    {resourcesByType.map((t, i) => (
                      <div key={t.name} style={{ width: `${(t.value / totalTypes) * 100}%`, background: catColor(i) }}
                        title={`${t.name} : ${t.value}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {resourcesByType.map((t, i) => (
                      <span key={t.name} className="flex items-center gap-1.5 text-data text-t3">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: catColor(i) }} />
                        {t.name} · <span className="font-semibold text-t1">{fr(t.value)}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : <p className="text-data text-t4 py-4 text-center">Aucune ressource</p>}
            </div>
          </div>
          {/* By category — single hue, magnitude */}
          <div className="lg:col-span-2">
            <p className="text-data text-t3 mb-3">Par catégorie</p>
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

        <div className="grid md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-line-soft">
          <div>
            <p className="text-label text-t3 uppercase mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-info" />Top — Plus vues
            </p>
            {topViewed.length ? topViewed.map((r, i) => (
              <TopRow key={r.id} rank={i + 1} title={r.title} type={r.type} count={r.viewCount} icon={Eye} tint="text-info" />
            )) : <p className="text-data text-t4 py-6 text-center">Aucune donnée</p>}
          </div>
          <div>
            <p className="text-label text-t3 uppercase mb-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-info" />Top — Plus téléchargées
            </p>
            {topDownloaded.length ? topDownloaded.map((r, i) => (
              <TopRow key={r.id} rank={i + 1} title={r.title} type={r.type} count={r.downloadCount} icon={Download} tint="text-info" />
            )) : <p className="text-data text-t4 py-6 text-center">Aucune donnée</p>}
          </div>
        </div>
      </Card>

      {/* ── PIPELINES ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6">
          <PanelHead icon={ClipboardList} title="Candidatures" subtitle="Accompagnement 360, événements & archives" tint="text-info"
            action={<Link to="/admin/applications" className="text-data text-gold hover:text-gold/80 flex items-center gap-1 flex-shrink-0">Voir <ArrowUpRight className="w-3 h-3" /></Link>} />
          <div className="space-y-3 mt-1">
            {applicationsByStatus.length ? applicationsByStatus.map((item) => (
              <Meter key={item.name} label={item.name} value={item.value} total={totalApps} color={SEQUENTIAL} />
            )) : <p className="text-data text-t4 text-center py-6">Aucune candidature</p>}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line-soft">
            <p className="text-data text-t3">Total</p>
            <p className="text-heading text-t1">{fr(totalApps)}</p>
          </div>
        </Card>

      </div>

      {/* ── EVENTS / ACTIONS / HEALTH ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 sm:p-6">
          <PanelHead icon={Calendar} title="Événements" subtitle="Répartition par statut" tint="text-success" />
          <div className="space-y-2 mt-1">
            {eventsByStatus.length ? eventsByStatus.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catColor(i) }} />
                  <span className="text-data text-t2 truncate">{item.name}</span>
                </div>
                <span className="text-data font-medium text-t1">{fr(item.value)}</span>
              </div>
            )) : <p className="text-data text-t4 text-center py-6">Aucun événement</p>}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <PanelHead icon={Zap} title="Actions rapides" />
          <div className="space-y-2 mt-1">
            {[
              { to: '/admin/resources', icon: FileText, label: 'Nouvelle ressource', c: 'bg-warning-subtle text-warning hover:bg-warning-subtle' },
              { to: '/admin/events', icon: Calendar, label: 'Nouvel événement', c: 'bg-success-subtle text-success hover:bg-success-subtle' },
              { to: '/admin/users', icon: Users, label: 'Gérer les utilisateurs', c: 'bg-info-subtle text-info hover:bg-info-subtle' },
            ].map(({ to, icon: Icon, label, c }) => (
              <Link key={to} to={to} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${c}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-data font-medium truncate">{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-60 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="bg-surface-2 rounded-xl p-4 sm:p-6 text-white ">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gold" />
            <h3 className="font-semibold">Santé de la plateforme</h3>
          </div>
          <div className="pt-4 mt-4 border-t border-line">
            <p className="text-data text-t4 mb-1">Taux de téléchargement</p>
            <div className="flex items-end gap-2">
              <span className="text-title text-info">{downloadRate}%</span>
              <span className="text-data text-t3 mb-1">des vues → téléchargement</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-line">
            <div><p className="text-data text-t4">Catégories</p><p className="text-title">{fr(stats?.totalCategories || 0)}</p></div>
            <div><p className="text-data text-t4">Tags</p><p className="text-title">{fr(stats?.totalTags || 0)}</p></div>
          </div>
          <div className="pt-4 mt-4 border-t border-line space-y-1.5">
            <p className="text-data text-t4 mb-1">Croissance 30 j</p>
            <div className="flex items-center justify-between text-data">
              <span className="text-t4">Nouveaux utilisateurs</span>
              <span className="font-bold text-success">+{fr(stats?.newUsersLast30Days || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-data">
              <span className="text-t4">Nouvelles ressources</span>
              <span className="font-bold text-info">+{fr(stats?.newResourcesLast30Days || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6">
          <PanelHead icon={Users} title="Derniers inscrits" tint="text-info" />
          <div className="space-y-1 mt-1">
            {stats?.recentUsers?.length ? stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-data font-medium text-gold">{(u.username || u.email || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-data font-medium text-t1 truncate">{u.email || u.username}</p>
                  <p className="text-data text-t4 truncate">{u.roleName} · {u.providerName}</p>
                </div>
                <span className="text-data text-t4 flex-shrink-0">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : ''}</span>
              </div>
            )) : <p className="text-data text-t4 text-center py-6">Aucun utilisateur récent</p>}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <PanelHead icon={FilePlus} title="Ressources récentes" />
          <div className="space-y-1 mt-1">
            {stats?.recentResources?.length ? stats.recentResources.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  r.resourceTypeName?.toUpperCase() === 'VIDEO' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-data font-medium text-t1 truncate">{r.title}</p>
                  <p className="text-data text-t4 truncate">{r.categoryName} · {r.resourceTypeName?.toUpperCase()}</p>
                </div>
                <span className="text-data text-t4 flex-shrink-0">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}</span>
              </div>
            )) : <p className="text-data text-t4 text-center py-6">Aucune ressource récente</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
