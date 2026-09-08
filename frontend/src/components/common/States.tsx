import type { ReactNode } from 'react';

/**
 * The empty and error states, written once.
 *
 * Each page previously invented its own panel — different radii, different padding,
 * different button shapes — which made otherwise identical situations look unrelated.
 */

const PANEL = 'rounded-3xl px-6 py-16 text-center';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Icon element, already sized by the caller. */
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div role="status" className={`${PANEL} border border-dashed border-line-strong bg-card`}>
      {icon && <div className="mb-5 flex justify-center text-gold-400">{icon}</div>}
      <p className="font-display text-xl text-t1 sm:text-2xl">{title}</p>
      {description && <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-t3">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  /** The sentence the backend produced; it already knows what it refused. */
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className={`${PANEL} border border-line-soft bg-card`}>
      <p className="font-medium text-t1">{title}</p>
      {message && <p className="mt-3 text-sm text-t3">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-6">
          Réessayer
        </button>
      )}
    </div>
  );
}
