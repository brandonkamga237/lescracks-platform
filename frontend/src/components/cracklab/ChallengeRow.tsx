import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock3 } from 'lucide-react';

import Difficulty from '@/components/cracklab/Difficulty';
import Schematic from '@/components/cracklab/Schematic';
import { challengePath } from '@/lib/cracklab';
import type { ChallengeSummary } from '@/services/types';

interface ChallengeRowProps {
  challenge: ChallengeSummary;
}

const WEEK = 7 * 24 * 3600 * 1000;
const stat = 'font-mono text-sm tabular-nums';

/** One line of the lab's checklist: what it is, how the others did, and whether you have done it. */
function ChallengeRow({ challenge }: ChallengeRowProps) {
  const fresh = !challenge.answered && challenge.publishedAt && Date.now() - new Date(challenge.publishedAt).getTime() < WEEK;
  const out = (value?: number) => (value == null ? <span className="text-t4">–</span> : <>{value}<span className="text-t4">/{challenge.totalPoints}</span></>);

  return (
    <li>
      <Link to={challengePath(challenge.slug)}
        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-4 transition-colors duration-150 hover:bg-noir-800/60 focus-visible:bg-noir-800/60 focus-visible:outline-none sm:grid-cols-[6rem_minmax(0,1fr)_4.5rem_4.5rem_4.5rem_5.5rem] sm:px-5">
        <span className="hidden overflow-hidden rounded border border-line-soft bg-noir-950 sm:block">
          <Schematic seed={challenge.slug} category={challenge.category} labels={false} className="block h-auto w-full" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-3 text-xs text-t4">
            <Difficulty value={challenge.difficulty} />
            <span className="font-mono">{challenge.category}</span>
            {fresh && <span className="font-mono text-gold-ink">nouveau</span>}
          </span>
          <span className="mt-1 line-clamp-2 text-pretty font-medium leading-snug text-t1 transition-colors duration-150 group-hover:text-gold-ink">{challenge.title}</span>
        </span>
        <span className={`hidden text-right text-t2 sm:block ${stat}`}>{challenge.submissionCount || <span className="text-t4">–</span>}</span>
        <span className={`hidden text-right text-t2 sm:block ${stat}`}>{out(challenge.averageScore)}</span>
        <span className={`hidden text-right text-t2 sm:block ${stat}`}>{out(challenge.bestScore)}</span>
        <span className={`row-span-2 text-right sm:row-span-1 ${stat}`}>
          {challenge.answered ? (
            challenge.myScore != null
              ? <span className="inline-flex items-center gap-1.5 text-gold-ink"><Check className="h-4 w-4" aria-hidden />{challenge.myScore}</span>
              : <span className="inline-flex items-center gap-1.5 text-xs text-t3"><Clock3 className="h-3.5 w-3.5" aria-hidden />notation</span>
          ) : <span className="text-xs text-t4">à relever</span>}
        </span>
        <span className="col-start-1 font-mono text-xs text-t4 sm:hidden">
          {challenge.submissionCount ? `${challenge.submissionCount} part. · moy. ${challenge.averageScore ?? '–'} · record ${challenge.bestScore ?? '–'}` : 'aucune réponse encore'}
        </span>
      </Link>
    </li>
  );
}

export default memo(ChallengeRow);
