import { cn } from '@/lib/utils';

/** A gold dot with a ring that keeps expanding: something is happening now. */
export function PulseDot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative flex h-1.5 w-1.5', className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-70 motion-reduce:animate-none" />
      <span className="relative inline-flex h-full w-full rounded-full bg-gold-400" />
    </span>
  );
}
