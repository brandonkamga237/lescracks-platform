import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import Difficulty from '@/components/cracklab/Difficulty';
import { challengePath } from '@/lib/cracklab';
import type { ChallengeSummary } from '@/services/types';

function ChallengeCard({ challenge }: { challenge: ChallengeSummary }) {
  return (
    <li className="h-full">
      <Link to={challengePath(challenge.slug)}
        className="group flex h-full flex-col rounded-lg border border-line bg-noir-900 p-5 transition-colors hover:border-gold-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Difficulty value={challenge.difficulty} />
          <span className="label">{challenge.category}</span>
        </div>
        <h3 className="mt-4 text-balance font-display text-xl font-bold leading-snug tracking-tight text-t1 transition-colors group-hover:text-gold-ink sm:text-[1.375rem]">
          {challenge.title}
        </h3>
        {challenge.tags.length > 0 && (
          <ul aria-label="Tags" className="mb-1 mt-4 flex flex-wrap gap-1.5">
            {challenge.tags.slice(0, 4).map((tag) => <li key={tag} className="rounded bg-noir-800 px-2 py-0.5 font-mono text-[11px] text-t3">{tag}</li>)}
          </ul>
        )}
        <span aria-hidden className="min-h-5 flex-1" />
        <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4 text-xs text-t4">
          <span className="font-mono tabular-nums">
            {challenge.totalPoints} pts{challenge.maxWords ? ` · ${challenge.maxWords} mots max` : ''} · {challenge.submissionCount} réponse{challenge.submissionCount > 1 ? 's' : ''}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 transition-colors group-hover:text-gold-ink" aria-hidden />
        </div>
      </Link>
    </li>
  );
}

export default memo(ChallengeCard);
