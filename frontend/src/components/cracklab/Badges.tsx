import { Award, CalendarCheck, Crown, Flame, Footprints, Layers, Sparkles, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { CrackLabBadge } from '@/services/types';

const ICON: Record<string, LucideIcon> = {
  FIRST_STEP: Footprints,
  FLAWLESS: Target,
  HARDCORE: Flame,
  VERSATILE: Layers,
  REGULAR: CalendarCheck,
  APPRECIATED: Sparkles,
  PODIUM: Crown,
};

const STAGGER = ['', '[animation-delay:60ms]', '[animation-delay:120ms]', '[animation-delay:180ms]', '[animation-delay:240ms]', '[animation-delay:300ms]', '[animation-delay:360ms]'];

interface BadgesProps {
  badges: CrackLabBadge[];
  /** Compact: icons only, for a card. */
  compact?: boolean;
}

/** Locked badges stay visible, dimmed, with what unlocks them: the next goal is always on screen. */
export default function Badges({ badges, compact = false }: BadgesProps) {
  if (compact) {
    return (
      <ul className="flex flex-wrap gap-1.5" aria-label="Badges">
        {badges.filter((badge) => badge.unlocked).map((badge) => {
          const Icon = ICON[badge.code] ?? Award;
          return (
            <li key={badge.code} title={badge.label} className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-ink">
              <Icon className="h-4 w-4" aria-hidden /><span className="sr-only">{badge.label}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {badges.map((badge, index) => {
        const Icon = ICON[badge.code] ?? Award;
        return (
          <li key={badge.code} className={`flex items-start gap-3 rounded-lg border p-3.5 ${badge.unlocked ? `border-gold-400/30 bg-gold-400/[0.06] motion-safe:animate-pop ${STAGGER[index] ?? ''}` : 'border-line bg-noir-900'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${badge.unlocked ? 'border-gold-400/50 bg-gold-400/15 text-gold-ink' : 'border-line bg-noir-800 text-t4'}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${badge.unlocked ? 'text-t1' : 'text-t3'}`}>{badge.label}<span className="sr-only">{badge.unlocked ? ' : obtenu' : ' : à débloquer'}</span></span>
              <span className="mt-0.5 block text-xs leading-relaxed text-t4">{badge.description}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
