import type { CrackLabLevel } from '@/services/types';

interface LevelChipProps {
  level: CrackLabLevel;
  className?: string;
}

export default function LevelChip({ level, className = '' }: LevelChipProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[11px] leading-none ${className}`}>
      <span className="text-gold-ink">N{level.number}</span><span className="text-t2">{level.name}</span>
    </span>
  );
}
