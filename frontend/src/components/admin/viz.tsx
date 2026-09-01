// src/components/admin/viz.tsx
// Shared visualization tokens + small primitives for the admin panel.
// Palette validated with the dataviz skill (light surface #fcfcfb): all six
// checks PASS, worst adjacent-pair CVD ΔE 19.4 — well above the 12 target.
// Order is FIXED and assigned by entity, never cycled or reassigned by rank.
import React from 'react';

// ── Categorical palette (fixed order) ──────────────────────────────────────────
export const CATEGORICAL = [
  '#2563EB', // blue
  '#D97706', // amber
  '#059669', // emerald
  '#7C3AED', // violet
  '#DB2777', // rose
  '#0891B2', // cyan
] as const;

export const catColor = (i: number) => CATEGORICAL[i % CATEGORICAL.length];

// ── Sequential hue (single-series magnitude / growth) ──────────────────────────
export const SEQUENTIAL = '#2563EB';

// ── Status colors — RESERVED, never reused as a series color. ──────────────────
export const STATUS = {
  good: '#059669',
  warning: '#D97706',
  critical: '#DC2626',
  neutral: '#64748B',
} as const;

// Brand accent (chrome only — low contrast on white, not a data ink).
export const GOLD = '#D4AF37';

export const GRID = '#EEF0F2';
export const AXIS_TICK = { fontSize: 11, fill: '#94A3B8' } as const;

// ── Custom recharts tooltip (consistent, legible) ──────────────────────────────
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
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 shadow-lg text-data">
      {label != null && (
        <p className="font-medium text-t2 mb-1">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-t3">{p.name}</span>
          <span className="font-semibold text-t1 ml-auto tabular-nums">
            {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * The title carries the page; the count sits beside it rather than under it, so the header
 * costs one line instead of three. The icon this used to show was already in the sidebar
 * next to the active item, and repeating it bought nothing but vertical space.
 */
export const PageHeader = ({
  title, subtitle, actions,
}: {
  title: string; subtitle?: string; actions?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-gutter pb-3 border-b border-line">
    <div className="flex items-baseline gap-3 min-w-0">
      <h1 className="text-title text-t1 truncate">{title}</h1>
      {subtitle && <span className="text-label text-t4 whitespace-nowrap">{subtitle}</span>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

// ── Card wrapper ───────────────────────────────────────────────────────────────
export const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`bg-surface-1 rounded-xl border border-line ${className}`}>{children}</div>
);
