// src/components/common/Skeleton.tsx
//
// Loading placeholders that mirror the shape of the real content.
//
// A centred spinner tells the user "something is happening". A skeleton tells them
// *what* is coming and how much of it — which makes the same wait feel shorter.
// That matters here: the API answers in ~30ms, but users are 150–300ms away from
// the server, so there is always a gap to fill with structure rather than emptiness.

interface SkeletonProps {
  className?: string;
}

/** A single shimmering block. Decorative — hidden from assistive tech. */
export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded bg-white/[0.07] ${className}`}
  />
);

/** Placeholder shaped like a resource / event card: thumbnail, title, meta, tags. */
export const CardSkeleton = () => (
  <div className="card overflow-hidden">
    <Skeleton className="h-40 w-full rounded-lg mb-4" />
    <Skeleton className="h-4 w-3/4 mb-2.5" />
    <Skeleton className="h-3 w-full mb-1.5" />
    <Skeleton className="h-3 w-5/6 mb-4" />
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
    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
    role="status"
    aria-label="Chargement en cours"
  >
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
    <span className="sr-only">Chargement du contenu…</span>
  </div>
);

/** Placeholder for a list of people (learners, contributors). */
export const PersonSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div
    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
    role="status"
    aria-label="Chargement en cours"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
    <span className="sr-only">Chargement du contenu…</span>
  </div>
);

export default Skeleton;
