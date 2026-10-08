import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, TrendingUp, Trophy } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import LevelChip from '@/components/cracklab/LevelChip';
import XpBar from '@/components/cracklab/XpBar';
import { memberPath, ordinal, plural, rankingPath } from '@/lib/cracklab';
import type { CrackLabProgress } from '@/services/types';

interface ProgressPanelProps {
  progress: CrackLabProgress;
}

/** What a member needs to see to come back: the next level, the rank to take, the streak to keep. */
export default function ProgressPanel({ progress }: ProgressPanelProps) {
  const streakAtRisk = progress.streak > 0 && !progress.activeThisWeek;
  const nudge = progress.rank === 0
    ? progress.answered ? 'Ta première note t’ouvre le classement.' : 'Réponds à un premier challenge pour entrer au classement.'
    : progress.rank === 1 ? 'Tu es en tête du classement. Garde ta place.'
      : `Plus que ${plural(progress.pointsToNextRank, 'point')} pour passer ${ordinal(progress.rank - 1)}.`;

  const tile = 'rounded-lg border border-line bg-noir-900/80 p-3.5';
  return (
    <section aria-labelledby="progress-heading" className="rounded-xl border border-gold-400/25 bg-noir-900/90 p-5 shadow-gold backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-3">
        <Avatar member={progress.member} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 id="progress-heading" className="truncate font-display text-xl font-bold text-t1">{progress.member.displayName}</h2>
          <div className="mt-1.5"><LevelChip level={progress.level} /></div>
        </div>
        <Link to={memberPath(progress.member.id)} className="inline-flex h-9 shrink-0 items-center gap-1 rounded px-2 text-xs text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
          Profil<ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <XpBar xp={progress.xp} level={progress.level} nextLevel={progress.nextLevel} className="mt-5" />

      <dl className="mt-5 grid grid-cols-3 gap-2">
        <div className={tile}>
          <dt className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-t4"><Trophy className="h-3 w-3" aria-hidden />Rang</dt>
          <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-t1">{progress.rank ? ordinal(progress.rank) : '—'}</dd>
          {progress.rank > 0 && <dd className="text-[11px] text-t4">sur {progress.rankedMembers}</dd>}
        </div>
        <div className={`${tile} ${streakAtRisk ? 'border-warning/40' : ''}`}>
          <dt className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-t4"><Flame className={`h-3 w-3 ${progress.activeThisWeek ? 'text-gold-ink' : ''}`} aria-hidden />Série</dt>
          <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-t1">{progress.streak}<span className="text-xs font-normal text-t4"> sem.</span></dd>
          <dd className="text-[11px] text-t4">record {progress.bestStreak}</dd>
        </div>
        <div className={tile}>
          <dt className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-t4"><TrendingUp className="h-3 w-3" aria-hidden />Semaine</dt>
          <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-t1">{progress.weekScore}<span className="text-xs font-normal text-t4"> pts</span></dd>
          <dd><Link to={rankingPath('week')} className="text-[11px] text-t4 underline-offset-2 hover:text-gold-ink hover:underline">podium</Link></dd>
        </div>
      </dl>

      <p className={`mt-4 rounded-lg px-3.5 py-2.5 text-sm ${streakAtRisk ? 'bg-warning/10 text-t1' : 'bg-gold-400/[0.07] text-t2'}`}>
        {streakAtRisk ? `Ta série de ${plural(progress.streak, 'semaine')} s’arrête dimanche soir : réponds à un challenge cette semaine.` : nudge}
      </p>
    </section>
  );
}
