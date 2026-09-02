import type { ApiError } from '@/services/http';

interface AdminSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** One heading, one optional action, so every back-office screen opens the same way. */
export function AdminSection({ title, description, action, children }: AdminSectionProps) {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-t1">{title}</h1>
          {description && <p className="mt-1 text-sm text-t4">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

interface AdminStateProps {
  loading: boolean;
  error: ApiError | null;
  empty: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * The three states every list has, rendered once.
 *
 * An error shows the sentence the backend wrote rather than a generic one: it already knows
 * what it refused, and rewording it here is how the two drift apart.
 */
export function AdminState({
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
  children,
}: AdminStateProps) {
  if (loading) return <p className="py-12 text-center text-t4">Chargement…</p>;

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-t2">{error.message}</p>
        {error.reference && (
          <p className="mt-2 font-mono text-xs text-t4">Référence {error.reference}</p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-sm text-gold-400 underline underline-offset-4"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (empty) return <p className="py-12 text-center text-t3">{emptyMessage}</p>;

  return <>{children}</>;
}

/** A row of the flat lists the back office is made of. */
export function AdminRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line-soft py-4">
      {children}
    </div>
  );
}
