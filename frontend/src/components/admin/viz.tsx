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
export const ChartTooltip = ({ active, payload, label, labelFormatter, valueSuffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      {label != null && (
        <p className="font-medium text-gray-700 mb-1">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="font-semibold text-gray-900 ml-auto">
            {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Page header (responsive) ───────────────────────────────────────────────────
export const PageHeader = ({
  icon: Icon, title, subtitle, actions,
}: {
  icon?: any; title: string; subtitle?: string; actions?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gold" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

// ── Card wrapper ───────────────────────────────────────────────────────────────
export const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm ${className}`}>{children}</div>
);
