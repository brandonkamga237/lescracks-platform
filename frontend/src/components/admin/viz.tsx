// Shared visualization tokens + primitives for the admin panel.
// The admin surface is dark (#000/#111): series colours are picked for legibility
// on dark backgrounds, gold stays reserved for the primary trend and states keep
// their own hues so data colour never means status.
import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Primary series — the brand gold. One metric, one line.
export const SERIES = '#D4AF37';
// Previous period or secondary series — desaturated, never mistaken for live data.
export const SERIES_MUTED = 'rgba(255,255,255,0.28)';

// Categorical palette, legible on #111. Order is fixed by entity, never by rank.
export const CATEGORICAL = [
  '#D4AF37',
  '#7DD3FC',
  '#34D399',
  '#A78BFA',
  '#FB923C',
  '#FB7185',
] as const;

export const catColor = (i: number) => CATEGORICAL[i % CATEGORICAL.length];

// Status colors — reserved, never reused as a series colour.
export const STATUS = {
  good: '#4ADE80',
  warning: '#FBBF24',
  critical: '#F87171',
  neutral: 'rgba(255,255,255,0.45)',
} as const;

export const GRID = 'rgba(255,255,255,0.06)';
export const TICK = { fontSize: 11, fill: 'rgba(255,255,255,0.45)' } as const;

export const fmt = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('fr-FR');

export const fmtDuration = (seconds: number | null | undefined) => {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m} min ${s.toString().padStart(2, '0')}` : `${s} s`;
};

const fmtDay = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

export const deltaPct = (value: number | null | undefined, previous: number | null | undefined) =>
  value == null || previous == null || previous === 0 ? null
    : Math.round(((value - previous) / previous) * 100);

// ── Delta badge ────────────────────────────────────────────────────────────────
export const Delta = ({ pct, invert = false }: { pct: number | null; invert?: boolean }) => {
  if (pct == null) return null;
  const good = invert ? pct < 0 : pct > 0;
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-medium tabular-nums ${
      pct === 0 ? 'bg-noir-800 text-t3'
        : good ? 'bg-emerald-400/10 text-emerald-400'
        : 'bg-error/10 text-error-ink'
    }`}>
      <Icon className="h-3 w-3" aria-hidden />
      {pct > 0 ? '+' : ''}{pct} %
    </span>
  );
};

// ── Sparkline ──────────────────────────────────────────────────────────────────
export const Sparkline = ({ data, dataKey = 'value' }: { data: Record<string, number | string>[]; dataKey?: string }) => {
  if (!data || data.length < 2) return null;
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <Area type="monotone" dataKey={dataKey} stroke={SERIES} strokeWidth={1.5}
            fill={SERIES} fillOpacity={0.12} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── KPI ────────────────────────────────────────────────────────────────────────
export const Kpi = ({
  label, value, delta, hint, spark, sparkKey,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  hint?: string;
  spark?: Record<string, number | string>[];
  sparkKey?: string;
}) => (
  <div className="rounded-lg border border-line-soft bg-card p-6">
    <p className="text-sm text-t3">{label}</p>
    <div className="mt-3 flex items-baseline gap-3">
      <p className="font-display text-4xl font-semibold tabular-nums">{value}</p>
      {delta != null && <Delta pct={delta} />}
    </div>
    {hint && <p className="mt-2 text-xs text-t4">{hint}</p>}
    {spark && <div className="mt-4"><Sparkline data={spark} dataKey={sparkKey} /></div>}
  </div>
);

// ── Custom tooltip ─────────────────────────────────────────────────────────────
type ChartTooltipProps = {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; fill?: string }[];
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
  valueSuffix?: string;
};

export const ChartTooltip = ({ active, payload, label, labelFormatter, valueSuffix = '' }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-noir-900 px-3 py-2 text-xs shadow-xl">
      {label != null && (
        <p className="mb-1 font-medium text-t2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-t3">{p.name}</span>
          <span className="ml-auto pl-4 font-semibold tabular-nums text-t1">
            {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Trend chart ────────────────────────────────────────────────────────────────
export interface TrendSeries {
  key: string;
  name: string;
  color?: string;
  dashed?: boolean;
  fill?: boolean;
}

export const TrendChart = ({
  data, series, height = 260,
}: {
  data: Record<string, number | string>[];
  series: TrendSeries[];
  height?: number;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SERIES} stopOpacity={0.25} />
          <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="date" tickFormatter={fmtDay} tick={TICK} axisLine={false} tickLine={false}
        minTickGap={32} stroke="none" />
      <YAxis tick={TICK} axisLine={false} tickLine={false} stroke="none" width={46}
        tickFormatter={(v: number) => v.toLocaleString('fr-FR')} />
      <Tooltip content={<ChartTooltip labelFormatter={(l) => `Le ${String(l).split('-').reverse().join('/')}`} />}
        cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
      {series.map((s, i) => (
        <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
          stroke={s.color ?? (i === 0 ? SERIES : SERIES_MUTED)}
          strokeWidth={s.dashed ? 1.5 : 2}
          strokeDasharray={s.dashed ? '5 4' : undefined}
          fill={s.fill !== false && !s.dashed ? 'url(#trendFill)' : 'none'}
          isAnimationActive={false}
          dot={false} activeDot={{ r: 3.5, stroke: '#000' }} />
      ))}
    </AreaChart>
  </ResponsiveContainer>
);

// ── Horizontal bar list (sources, countries, pages) ────────────────────────────
export const BarList = ({ items, format }: {
  items: { name: string; count: number }[];
  format?: (name: string) => string;
}) => {
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={item.name}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-t2">{format ? format(item.name) : item.name}</span>
            <span className="shrink-0 tabular-nums text-t3">{item.count.toLocaleString('fr-FR')}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-noir-800">
            <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: catColor(i) }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

// ── Panel ──────────────────────────────────────────────────────────────────────
export const Panel = ({
  title, subtitle, action, className = '', children,
}: {
  title?: string; subtitle?: string; action?: React.ReactNode;
  className?: string; children: React.ReactNode;
}) => (
  <section className={`rounded-lg border border-line-soft bg-card p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h2 className="font-display text-lg font-semibold text-t1">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-t3">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

// ── Period selector ────────────────────────────────────────────────────────────
export const PERIODS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
  { days: 180, label: '6 mois' },
  { days: 365, label: '12 mois' },
] as const;

export const PeriodSelect = ({ value, onChange }: { value: number; onChange: (days: number) => void }) => (
  <div className="inline-flex rounded border border-line bg-noir-900 p-1" role="group" aria-label="Période">
    {PERIODS.map((p) => (
      <button key={p.days} type="button" onClick={() => onChange(p.days)}
        className={`rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
          value === p.days ? 'bg-gold-400 text-black' : 'text-t3 hover:text-t1'
        }`}>
        {p.label}
      </button>
    ))}
  </div>
);
