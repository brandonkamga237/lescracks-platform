import type { CrackLabLevel } from '@/services/types';

interface LevelChipProps {
  level: CrackLabLevel;
  className?: string;
}

/** Level number in a gold tab, the name beside it: the same shape on every board and profile. */
export default function LevelChip({ level, className = '' }: LevelChipProps) {
  return (
    <span className={`inline-flex items-center overflow-hidden rounded border border-gold-400/30 font-mono text-[11px] font-semibold leading-none ${className}`}>
      <span className="bg-gold-400 px-1.5 py-1 text-black">N{level.number}</span>
      <span className="px-1.5 py-1 text-gold-ink">{level.name}</span>
    </span>
  );
}
