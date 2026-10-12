import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3 } from 'lucide-react';

import Difficulty from '@/components/cracklab/Difficulty';
import { challengePath } from '@/lib/cracklab';
import type { ChallengeSummary } from '@/services/types';

interface ChallengeRowProps {
  challenge: ChallengeSummary;
}

const WEEK = 7 * 24 * 3600 * 1000;

/** One challenge: what it is and where the member stands on it. No crowd figures: they compare, they do not help. */
function ChallengeRow({ challenge }: ChallengeRowProps) {
  const fresh = !challenge.answered && challenge.publishedAt && Date.now() - new Date(challenge.publishedAt).getTime() < WEEK;

  return (
    <li>
      <Link to={challengePath(challenge.slug)}
        className="group flex items-center gap-4 px-5 py-5 transition-colors duration-150 hover:bg-noir-900 focus-visible:bg-noir-900 focus-visible:outline-none sm:px-6">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-t4">
            <Difficulty value={challenge.difficulty} />
            <span>{challenge.category}</span>
            {fresh && <span className="font-mono text-gold-ink">nouveau</span>}
          </span>
          <span className="mt-1.5 block text-pretty text-lg font-medium leading-snug text-t1 transition-colors duration-150 group-hover:text-gold-ink">{challenge.title}</span>
        </span>
        <span className="shrink-0 text-right text-sm">
          {challenge.answered ? (
            challenge.myScore != null
              ? <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-gold-ink"><Check className="h-4 w-4" aria-hidden />{challenge.myScore} pts</span>
              : <span className="inline-flex items-center gap-1.5 text-t3"><Clock3 className="h-4 w-4" aria-hidden />Envoyé</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-t3 transition-colors duration-150 group-hover:text-gold-ink">Relever<ArrowRight className="h-4 w-4" aria-hidden /></span>
          )}
        </span>
      </Link>
    </li>
  );
}

export default memo(ChallengeRow);
