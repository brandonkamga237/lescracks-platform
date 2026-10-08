import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Clock3, Users } from 'lucide-react';

import Difficulty from '@/components/cracklab/Difficulty';
import { challengePath, plural } from '@/lib/cracklab';
import type { ChallengeSummary } from '@/services/types';

interface ChallengeCardProps {
  challenge: ChallengeSummary;
}

const WEEK = 7 * 24 * 3600 * 1000;

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const fresh = !challenge.answered && challenge.publishedAt && Date.now() - new Date(challenge.publishedAt).getTime() < WEEK;
  const stat = 'flex flex-col gap-0.5';
  return (
    <li className="h-full">
      <Link to={challengePath(challenge.slug)}
        className={`group relative flex h-full flex-col rounded-lg border p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:p-6 ${
          challenge.answered ? 'border-line-soft bg-noir-900/60 hover:border-gold-400/30' : 'border-line bg-noir-900 hover:border-gold-400/40'}`}>
        <div className="flex items-center justify-between gap-3">
          <Difficulty value={challenge.difficulty} />
          {challenge.answered ? (
            challenge.myScore != null
              ? <span className="inline-flex items-center gap-1 rounded bg-gold-400/15 px-2 py-0.5 font-mono text-xs font-semibold text-gold-ink"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />{challenge.myScore}/{challenge.totalPoints}</span>
              : <span className="inline-flex items-center gap-1 rounded bg-noir-800 px-2 py-0.5 text-xs text-t3"><Clock3 className="h-3.5 w-3.5" aria-hidden />En notation</span>
          ) : fresh ? <span className="rounded bg-gold-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-black">Nouveau</span>
            : <span className="label">{challenge.category}</span>}
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
        {challenge.submissionCount === 0 ? (
          <p className="flex items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm">
            <span className="font-semibold text-gold-ink">Personne n’a encore répondu : ouvre le bal.</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-t4 transition-colors group-hover:text-gold-ink" aria-hidden />
          </p>
        ) : (
          <dl className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 border-t border-line-soft pt-4 text-xs">
            <div className={stat}><dt className="text-t4">Participants</dt><dd className="flex items-center gap-1 font-mono font-semibold tabular-nums text-t1"><Users className="h-3.5 w-3.5 text-t4" aria-hidden />{challenge.submissionCount}</dd></div>
            <div className={stat}><dt className="text-t4">Moyenne</dt><dd className="font-mono font-semibold tabular-nums text-t1">{challenge.averageScore ?? '—'}<span className="font-normal text-t4">/{challenge.totalPoints}</span></dd></div>
            <div className={stat}><dt className="text-t4">Record</dt><dd className="font-mono font-semibold tabular-nums text-gold-ink">{challenge.bestScore ?? '—'}<span className="font-normal text-t4">/{challenge.totalPoints}</span></dd></div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-t4 transition-colors group-hover:text-gold-ink" aria-hidden />
          </dl>
        )}
        <span className="sr-only">{challenge.maxWords ? `${challenge.maxWords} mots maximum, ` : ''}{plural(challenge.submissionCount, 'réponse')}</span>
      </Link>
    </li>
  );
}

export default memo(ChallengeCard);
