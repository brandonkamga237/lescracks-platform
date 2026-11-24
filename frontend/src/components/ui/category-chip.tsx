import { cn } from '@/lib/utils';

/** A theme as a small label with a gold dot: small enough to sit in a card's foot, distinct enough to be found. */
export function CategoryChip({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-[11px] font-medium leading-none text-gold-400', className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
      <span className="truncate">{name}</span>
    </span>
  );
}
