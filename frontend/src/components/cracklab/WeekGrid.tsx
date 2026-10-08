import { weekIndex } from '@/lib/cracklab';
import type { CrackLabHistoryItem } from '@/services/types';

interface WeekGridProps {
  history: CrackLabHistoryItem[];
  weeks?: number;
  className?: string;
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** The streak made visible: one cell per week, filled when an answer was sent that week. */
export default function WeekGrid({ history, weeks = 12, className = '' }: WeekGridProps) {
  const current = weekIndex(new Date());
  const active = new Set(history.map((item) => weekIndex(new Date(item.createdAt))));
  const cells = Array.from({ length: weeks }, (_, i) => current - weeks + 1 + i);
  const count = cells.filter((week) => active.has(week)).length;

  return (
    <figure className={className}>
      <ol className="flex gap-1" aria-label={`Semaines actives : ${count} sur les ${weeks} dernières`}>
        {cells.map((week) => {
          const monday = new Date((week * 7 - 3) * 86_400_000);
          const on = active.has(week);
          return (
            <li key={week} title={`Semaine du ${dayFormat.format(monday)}${on ? ' : active' : ''}`}
              className={`h-3 flex-1 rounded-[2px] ${on ? 'bg-gold-400' : 'bg-noir-700'} ${week === current && !on ? 'outline outline-1 -outline-offset-1 outline-gold-400/60' : ''}`}>
              <span className="sr-only">{dayFormat.format(monday)} {on ? 'active' : 'inactive'}</span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-2 flex justify-between font-mono text-[11px] text-t4"><span>il y a {weeks} sem.</span><span>cette semaine</span></figcaption>
    </figure>
  );
}
