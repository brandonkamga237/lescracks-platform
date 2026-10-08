import { useState } from 'react';
import { Link } from 'react-router-dom';

import Avatar from '@/components/cracklab/Avatar';
import { useApi } from '@/hooks/useApi';
import { memberPath, rankingPath, weekResetsIn } from '@/lib/cracklab';
import { api } from '@/services/api';
import type { RankingPeriod } from '@/services/types';

/** The top five, this week or of all time, with the way to the full board. */
export default function RankingMini() {
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const ranking = useApi((signal) => api.cracklab.ranking(period, 0, 5, signal), [period]);
  const list = ranking.data?.content ?? [];

  return (
    <div className="rounded-lg border border-line bg-noir-900">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5">
        <div role="tablist" aria-label="Période" className="flex gap-4">
          {([['week', 'Semaine'], ['all', 'Global']] as const).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)}
              className={`-mb-px border-b py-3 text-sm transition-colors duration-150 ${period === value ? 'border-gold-400 text-t1' : 'border-transparent text-t4 hover:text-t2'}`}>{label}</button>
          ))}
        </div>
        <Link to={rankingPath(period)} className="link text-xs">Tout voir</Link>
      </div>
      {list.length ? (
        <ol className={ranking.loading ? 'opacity-60' : ''}>
          {list.map((entry) => (
            <li key={entry.member.id}>
              <Link to={memberPath(entry.member.id)} className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150 hover:bg-noir-800/60 ${entry.me ? 'shadow-[inset_2px_0_0_theme(colors.gold.400)]' : ''}`}>
                <span className={`w-4 font-mono tabular-nums ${entry.rank === 1 ? 'text-gold-ink' : 'text-t4'}`}>{entry.rank}</span>
                <Avatar member={entry.member} size="sm" />
                <span className="min-w-0 flex-1 truncate text-t2">{entry.member.displayName}{entry.me && <span className="text-t4"> · toi</span>}</span>
                <span className="font-mono tabular-nums text-t1">{entry.totalScore}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 py-4 text-sm leading-relaxed text-t4">
          {ranking.loading ? 'Chargement…' : period === 'week' ? 'Personne n’a encore marqué cette semaine.' : 'La première réponse notée ouvre le classement.'}
        </p>
      )}
      {period === 'week' && <p className="border-t border-line-soft px-5 py-2.5 font-mono text-[11px] text-t4">remise à zéro dans {weekResetsIn()}</p>}
    </div>
  );
}
