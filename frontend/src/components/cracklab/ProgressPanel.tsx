import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import LevelChip from '@/components/cracklab/LevelChip';
import WeekGrid from '@/components/cracklab/WeekGrid';
import XpBar from '@/components/cracklab/XpBar';
import { memberPath, ordinal, plural, rankingPath } from '@/lib/cracklab';
import type { CrackLabProgress } from '@/services/types';

interface ProgressPanelProps {
  progress: CrackLabProgress;
}

/** The member's bench: where they stand, and the one gap worth closing next. */
export default function ProgressPanel({ progress }: ProgressPanelProps) {
  const streakAtRisk = progress.streak > 0 && !progress.activeThisWeek;
  const next = streakAtRisk ? `Ta série de ${plural(progress.streak, 'semaine')} s’arrête dimanche : une réponse cette semaine la prolonge.`
    : progress.rank === 0 ? progress.answered ? 'Ta première note t’ouvre le classement.' : 'Une première réponse t’ouvre le classement.'
      : progress.rank === 1 ? 'Tu mènes le classement.'
        : `${plural(progress.pointsToNextRank, 'point')} pour passer ${ordinal(progress.rank - 1)}.`;
  const figure = 'px-4 py-3 first:pl-0 last:pr-0';
  const label = 'font-mono text-[11px] uppercase tracking-[0.08em] text-t4';
  const value = 'mt-1 font-mono text-xl tabular-nums text-t1';

  return (
    <section aria-labelledby="progress-heading" className="rounded-lg border border-line bg-noir-900 p-5">
      <div className="flex items-center gap-3">
        <Avatar member={progress.member} size="md" />
        <div className="min-w-0 flex-1">
          <h2 id="progress-heading" className="truncate font-sans text-base font-medium tracking-normal text-t1">{progress.member.displayName}</h2>
          <LevelChip level={progress.level} className="mt-1" />
        </div>
        <Link to={memberPath(progress.member.id)} className="link shrink-0 text-xs">Profil</Link>
      </div>

      <XpBar xp={progress.xp} level={progress.level} nextLevel={progress.nextLevel} className="mt-5" />

      <dl className="mt-5 grid grid-cols-3 divide-x divide-line-soft border-y border-line-soft">
        <div className={figure}><dt className={label}>Rang</dt><dd className={value}>{progress.rank ? ordinal(progress.rank) : '–'}<span className="text-xs text-t4">{progress.rank ? ` /${progress.rankedMembers}` : ''}</span></dd></div>
        <div className={figure}><dt className={label}>Série</dt><dd className={value}>{progress.streak}<span className="text-xs text-t4"> sem.</span></dd></div>
        <div className={figure}><dt className={label}>Semaine</dt><dd className={value}>{progress.weekScore}<span className="text-xs text-t4"> pts</span></dd></div>
      </dl>

      <WeekGrid history={progress.history} className="mt-5" />

      <p className={`mt-5 flex items-start gap-2 text-sm ${streakAtRisk ? 'text-warning-ink' : 'text-t2'}`}>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
        <span>{next} {!streakAtRisk && progress.rank > 0 && <Link to={rankingPath('week')} className="link">Classement</Link>}</span>
      </p>
    </section>
  );
}
