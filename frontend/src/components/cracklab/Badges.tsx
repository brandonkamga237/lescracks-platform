import { Award, CalendarCheck, Flame, Footprints, Layers, Medal, Sparkles, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { CrackLabBadge } from '@/services/types';

const ICON: Record<string, LucideIcon> = {
  FIRST_STEP: Footprints,
  FLAWLESS: Target,
  HARDCORE: Flame,
  VERSATILE: Layers,
  REGULAR: CalendarCheck,
  APPRECIATED: Sparkles,
  PODIUM: Medal,
};

interface BadgesProps {
  badges: CrackLabBadge[];
  className?: string;
}

/** Earned badges first; the locked ones stay listed with what unlocks them, so the next goal is always written down. */
export default function Badges({ badges, className = '' }: BadgesProps) {
  const ordered = [...badges].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  return (
    <ul className={`divide-y divide-line-soft border-y border-line-soft ${className}`}>
      {ordered.map((badge) => {
        const Icon = ICON[badge.code] ?? Award;
        return (
          <li key={badge.code} className="flex items-start gap-3 py-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${badge.unlocked ? 'border-gold-400 text-gold-ink' : 'border-dashed border-line-strong text-t4'}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className={`block text-sm ${badge.unlocked ? 'text-t1' : 'text-t3'}`}>{badge.label}<span className="sr-only">{badge.unlocked ? ' : obtenu' : ' : à débloquer'}</span></span>
              <span className="block text-xs leading-relaxed text-t4">{badge.description}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
