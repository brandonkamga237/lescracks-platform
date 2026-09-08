interface SkeletonProps {
  className?: string;
}

/** A single shimmering block. Decorative — hidden from assistive tech. */
export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-2xl bg-white/[0.04] ${className}`}
  />
);

/** Placeholder shaped like a resource / event card: thumbnail, title, meta, tags. */
export const CardSkeleton = () => (
  <div className="card overflow-hidden">
    <Skeleton className="mb-5 h-44 w-full rounded-2xl" />
    <Skeleton className="mb-3 h-4 w-3/4" />
    <Skeleton className="mb-2 h-3 w-full" />
    <Skeleton className="mb-5 h-3 w-5/6" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  </div>
);

/**
 * A grid of card placeholders.
 *
 * `count` should roughly match the real page size so the layout doesn't jump
 * when the data lands.
 */
export const CardSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div
    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    role="status"
    aria-label="Chargement en cours"
  >
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
    <span className="sr-only">Chargement du contenu…</span>
  </div>
);

/** Placeholder for a list of people. */
export const PersonSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div
    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    role="status"
    aria-label="Chargement en cours"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card flex items-center gap-4">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
    <span className="sr-only">Chargement du contenu…</span>
  </div>
);

export default Skeleton;
