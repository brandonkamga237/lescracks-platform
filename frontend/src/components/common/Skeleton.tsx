interface SkeletonProps {
  className?: string;
}

/** A single shimmering block. Decorative — hidden from assistive tech. */
export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded bg-noir-900 ${className}`}
  />
);

export default Skeleton;
