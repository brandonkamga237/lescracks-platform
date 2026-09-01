import { Loader2 } from 'lucide-react';

interface AsyncStateProps {
  loading?: boolean;
  error?: string | null;
  /** True when the request succeeded but returned nothing. */
  empty?: boolean;
  emptyLabel?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * The three outcomes of a request, in one place. Fifty-two screens rendered the spinner and
 * then forgot the other two, so a failed load was indistinguishable from an empty list.
 */
const AsyncState = ({
  loading,
  error,
  empty,
  emptyLabel = 'Rien à afficher pour le moment.',
  onRetry,
  children,
}: AsyncStateProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-t4" role="status">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        <span className="text-data">Chargement…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
        <p className="text-data text-error max-w-sm">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-data text-gold hover:text-gold-light underline underline-offset-4"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return <p className="py-12 text-center text-data text-t4">{emptyLabel}</p>;
  }

  return <>{children}</>;
};

export default AsyncState;
