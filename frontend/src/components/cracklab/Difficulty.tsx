import { DIFFICULTY_LABEL } from '@/lib/cracklab';
import type { ChallengeDifficulty } from '@/services/types';

const LEVEL: Record<ChallengeDifficulty, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
const BAR_HEIGHT = ['h-[7px]', 'h-[10px]', 'h-[13px]'];

/** Three bars, filled up to the level: readable at a glance, and the label says it for screen readers. */
export default function Difficulty({ value }: { value: ChallengeDifficulty }) {
  const level = LEVEL[value];
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-t2">
      <span aria-hidden className="flex items-end gap-0.5">
        {BAR_HEIGHT.map((height, index) => <span key={height} className={`w-1 rounded-sm ${height} ${index < level ? 'bg-gold-400' : 'bg-noir-700'}`} />)}
      </span>
      {DIFFICULTY_LABEL[value]}
    </span>
  );
}
