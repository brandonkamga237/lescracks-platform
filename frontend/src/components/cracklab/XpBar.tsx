import { fillClass } from '@/lib/cracklab';
import type { CrackLabLevel } from '@/services/types';

interface XpBarProps {
  xp: number;
  level: CrackLabLevel;
  nextLevel?: CrackLabLevel;
  className?: string;
}

/** Progress inside the current level, with what is left to reach the next one. */
export default function XpBar({ xp, level, nextLevel, className = '' }: XpBarProps) {
  const ratio = nextLevel ? (xp - level.minXp) / (nextLevel.minXp - level.minXp) : 1;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 font-mono text-xs tabular-nums">
        <span className="text-t2">{xp} XP</span>
        <span className="text-t4">{nextLevel ? `${nextLevel.minXp - xp} XP avant ${nextLevel.name}` : 'Niveau maximum'}</span>
      </div>
      <div role="progressbar" aria-label="Progression vers le niveau suivant" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, ratio) * 100)}
        className="mt-2 h-2 overflow-hidden rounded-full bg-noir-700">
        <div className={`h-full origin-left rounded-full bg-gradient-to-r from-gold-500 to-gold-300 motion-safe:animate-grow-x ${fillClass(ratio)}`} />
      </div>
    </div>
  );
}
