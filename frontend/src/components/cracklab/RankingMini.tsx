import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';

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
    <div className="rounded-lg border border-line bg-noir-900 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="top-heading" className="font-display text-lg font-bold text-t1">Classement</h2>
        <Link to={rankingPath(period)} className="link text-xs">Tout voir</Link>
      </div>
      <div role="tablist" aria-label="Période" className="mt-3 grid grid-cols-2 gap-1 rounded bg-noir-800 p-1">
        {([['week', 'Cette semaine'], ['all', 'Global']] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)}
            className={`min-h-8 rounded text-xs font-medium transition-colors ${period === value ? 'bg-noir-600 text-t1' : 'text-t3 hover:text-t1'}`}>{label}</button>
        ))}
      </div>
      {period === 'week' && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-t4"><Timer className="h-3 w-3" aria-hidden />Remise à zéro dans {weekResetsIn()}</p>}
      {list.length ? (
        <ol className={`mt-3 space-y-0.5 ${ranking.loading ? 'opacity-60' : ''}`}>
          {list.map((entry) => (
            <li key={entry.member.id}>
              <Link to={memberPath(entry.member.id)} className={`flex items-center gap-2.5 rounded px-2 py-2 text-sm transition-colors hover:bg-noir-800 ${entry.me ? 'bg-gold-400/10' : ''}`}>
                <span className={`w-5 font-mono font-bold tabular-nums ${entry.rank <= 3 ? 'text-gold-ink' : 'text-t4'}`}>{entry.rank}</span>
                <Avatar member={entry.member} size="sm" />
                <span className="min-w-0 flex-1 truncate text-t1">{entry.member.displayName}{entry.me && <span className="text-t4"> (toi)</span>}</span>
                <span className="font-mono tabular-nums text-t2">{entry.totalScore}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-t4">
          {ranking.loading ? 'Chargement…' : period === 'week' ? 'Personne n’a encore marqué cette semaine. Le podium est à prendre.' : 'La première réponse notée ouvre le classement.'}
        </p>
      )}
    </div>
  );
}
