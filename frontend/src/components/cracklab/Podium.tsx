import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import LevelChip from '@/components/cracklab/LevelChip';
import { memberPath } from '@/lib/cracklab';
import type { RankingEntry } from '@/services/types';

interface PodiumProps {
  entries: RankingEntry[];
}

// Second, first, third: the classic podium order, the winner in the middle and highest.
const ORDER = [1, 0, 2];
const STEP = ['h-28 sm:h-36', 'h-20 sm:h-24', 'h-14 sm:h-16'];
const DELAY = ['[animation-delay:240ms]', '', '[animation-delay:120ms]'];

export default function Podium({ entries }: PodiumProps) {
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Podium">
      {ORDER.map((index) => {
        const entry = entries[index];
        if (!entry) return <li key={index} aria-hidden />;
        const first = entry.rank === 1;
        return (
          <li key={entry.member.id} className={`flex min-w-0 flex-col items-center motion-safe:animate-rise ${DELAY[index]} ${first ? '' : 'pt-6'}`}>
            <Link id={entry.me ? 'ranking-me' : undefined} to={memberPath(entry.member.id)} className="group flex w-full min-w-0 flex-col items-center text-center">
              {first && <Crown className="mb-1 h-6 w-6 text-gold-ink" aria-hidden />}
              <span className={`rounded-full p-0.5 ${first ? 'bg-gradient-to-b from-gold-300 to-gold-600 shadow-gold' : entry.me ? 'bg-gold-400/60' : 'bg-line'}`}>
                <Avatar member={entry.member} size={first ? 'xl' : 'lg'} className="border-0" />
              </span>
              <span className="mt-3 w-full truncate px-1 text-sm font-semibold text-t1 group-hover:text-gold-ink sm:text-base">{entry.member.displayName}</span>
              <span className="mt-1.5 hidden sm:block"><LevelChip level={entry.level} /></span>
              <span className="mt-1.5 font-mono text-lg font-bold tabular-nums text-t1 sm:text-xl">{entry.totalScore}<span className="text-xs font-normal text-t4"> pts</span></span>
              {entry.me && <span className="mt-1 rounded bg-gold-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-gold-ink">toi</span>}
            </Link>
            <div className={`mt-3 flex w-full items-start justify-center rounded-t-lg border border-b-0 pt-3 font-display text-3xl font-bold ${STEP[index]} ${
              first ? 'border-gold-400/50 bg-gradient-to-b from-gold-400/25 to-gold-400/[0.03] text-gold-ink' : 'border-line bg-gradient-to-b from-noir-800 to-noir-900 text-t3'}`}>
              {entry.rank}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
