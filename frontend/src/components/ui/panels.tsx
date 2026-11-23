import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface EmptyPanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Nothing to show yet, said plainly, with where to go instead. */
export function EmptyPanel({ title, description, action }: EmptyPanelProps) {
  return (
    <div role="status" className="rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center sm:px-10">
      <p className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</p>
      {description && <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/55">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

interface ErrorPanelProps {
  title: string;
  /** The backend's sentence: it already knows what went wrong. */
  message?: string;
  onRetry?: () => void;
}

export function ErrorPanel({ title, message, onRetry }: ErrorPanelProps) {
  return (
    <div role="alert" className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {message && <p className="mt-2 text-sm text-white/55">{message}</p>}
      {onRetry && <Button type="button" variant="outline" className="mt-6" onClick={onRetry}>Réessayer</Button>}
    </div>
  );
}

/** Placeholder lines while a list loads, at the height of the rows they stand for. */
export function RowsLoading({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" className="border-t border-white/10">
      {Array.from({ length: rows }, (_, index) => <div key={index} aria-hidden="true" className="h-[97px] animate-pulse border-b border-white/10 bg-white/[0.02] motion-reduce:animate-none" />)}
      <span className="sr-only">{label}</span>
    </div>
  );
}
