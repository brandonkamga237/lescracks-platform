import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Timer, Trophy } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import LevelChip from '@/components/cracklab/LevelChip';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { useCrackLabProgress } from '@/hooks/useCrackLabProgress';
import { memberPath, ordinal, plural, rankingPath, weekResetsIn } from '@/lib/cracklab';
import { api } from '@/services/api';
import type { RankingEntry, RankingPeriod } from '@/services/types';

const PAGE_SIZE = 25;

/** Where the member stands, pinned under the board: the gap to close is the reason to play one more. */
function MyPosition({ period, page }: { period: RankingPeriod; page: RankingEntry[] }) {
  const { progress } = useCrackLabProgress();
  const [rowInView, setRowInView] = useState(false);

  // The pinned bar repeats the member's own row: it steps aside while that row is on screen.
  useEffect(() => {
    const row = document.getElementById('ranking-me');
    setRowInView(false);
    if (!row) return;
    const observer = new IntersectionObserver(([entry]) => setRowInView(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(row);
    return () => observer.disconnect();
  }, [page]);

  if (!progress) return null;
  const onPage = page.find((entry) => entry.me);
  let line: string;
  if (period === 'week') {
    line = onPage ? `${ordinal(onPage.rank)} cette semaine · ${onPage.totalScore} pts` : progress.weekScore ? `${progress.weekScore} pts cette semaine` : 'Pas encore de points cette semaine';
  } else if (!progress.rank) {
    line = 'Pas encore classé : ta première note t’ouvre le classement';
  } else {
    line = `${ordinal(progress.rank)} sur ${progress.rankedMembers} · ${progress.xp} pts${progress.pointsToNextRank ? ` · ${progress.pointsToNextRank} pts pour passer ${ordinal(progress.rank - 1)}` : ' · en tête'}`;
  }
  return (
    <div className={`sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 mt-6 transition-[opacity,transform] duration-200 ease-out lg:bottom-4 ${rowInView ? 'pointer-events-none translate-y-2 opacity-0' : ''}`}>
      <div className="flex items-center gap-3 rounded-lg border border-line-strong bg-noir-900 p-3 shadow-[inset_2px_0_0_theme(colors.gold.400)] sm:p-4">
        <Avatar member={progress.member} size="md" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="block font-medium text-t1">Ta position</span>
          <span className="line-clamp-2 font-mono text-xs text-t3 sm:text-sm">{line}</span>
        </p>
        <Link to="/cracklab#challenges" className="btn-primary shrink-0 px-3 sm:px-4">
          <span className="hidden sm:inline">Gagner des points</span><span className="sm:hidden">Jouer</span><ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/** Ranked on the technical score only: the sum over graded answers. Votes are shown elsewhere, never counted here. */
export default function Ranking() {
  const [params, setParams] = useSearchParams();
  const period: RankingPeriod = params.get('periode') === 'semaine' ? 'week' : 'all';
  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const ranking = useApi((signal) => api.cracklab.ranking(period, page - 1, PAGE_SIZE, signal), [period, page]);
  const list = ranking.data?.content ?? [];
  const week = period === 'week';
  const leader = list[0];

  function choose(next: RankingPeriod) {
    setParams(next === 'week' ? { periode: 'semaine' } : {}, { replace: true });
  }

  return (
    <CrackLabLayout>
      <SEO title={week ? 'Le podium de la semaine · CrackLab' : 'Classement · CrackLab'} description="Le classement CrackLab : la somme des scores techniques obtenus sur les challenges d’ingénierie." url={rankingPath(period)} />
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-gold-ink">cracklab / classement</p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-t1 sm:text-5xl">{week ? 'Classement de la semaine' : 'Classement général'}</h1>
          </div>
          <ShareButton className="w-full sm:w-auto" title={week ? 'Classement de la semaine' : 'Classement CrackLab'} path={rankingPath(period)} label="Partager"
            text={leader ? `${leader.member.displayName} mène ${week ? 'le classement de la semaine' : 'le classement CrackLab'} avec ${leader.totalScore} pts. Qui prend sa place ?` : 'Le classement CrackLab est encore libre. Viens prendre la première place :'} />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b border-line-soft">
          <div role="tablist" aria-label="Période" className="flex gap-6">
            {([['week', 'Cette semaine'], ['all', 'Général']] as const).map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => choose(value)}
                className={`-mb-px border-b py-3 text-sm transition-colors duration-150 ${period === value ? 'border-gold-400 text-t1' : 'border-transparent text-t4 hover:text-t2'}`}>{label}</button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 pb-3 font-mono text-xs text-t4">
            {week ? <><Timer className="h-3.5 w-3.5" aria-hidden />remise à zéro dans {weekResetsIn()}</> : 'somme des scores techniques'}
          </p>
        </div>

        <div className="mt-6">
          {ranking.loading && !list.length ? (
            <div role="status" className="space-y-px">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}<span className="sr-only">Chargement du classement…</span></div>
          ) : ranking.error ? (
            <ErrorState title="Le classement est momentanément indisponible." message={ranking.error.message} onRetry={ranking.reload} />
          ) : !list.length ? (
            <EmptyState icon={<Trophy className="h-8 w-8" aria-hidden />}
              title={week ? 'Personne n’a encore marqué cette semaine.' : 'Personne n’est encore classé.'}
              description={week ? 'Une réponse notée cette semaine suffit pour entrer au classement.' : 'Le classement s’ouvre avec la première réponse notée.'}
              action={<Link to="/cracklab#challenges" className="btn-primary">Relever un challenge</Link>} />
          ) : (
            <div className={ranking.loading ? 'opacity-60' : ''}>
              <div className="overflow-hidden rounded-lg border border-line">
                <div aria-hidden className="hidden grid-cols-[3rem_minmax(0,1fr)_7rem_6rem_5rem_5rem] gap-x-4 border-b border-line-soft bg-noir-900 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-t4 sm:grid">
                  <span>#</span><span>Membre</span><span>Niveau</span><span className="text-right">Challenges</span><span className="text-right">Écart</span><span className="text-right">Points</span>
                </div>
                <ol className="divide-y divide-line-soft">
                  {list.map((entry, index) => {
                    const top = entry.rank <= 3 && page === 1;
                    const gap = index > 0 ? list[index - 1].totalScore - entry.totalScore : null;
                    return (
                      <li key={entry.member.id}>
                        <Link id={entry.me ? 'ranking-me' : undefined} to={memberPath(entry.member.id)}
                          className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 px-4 transition-colors duration-150 hover:bg-noir-800/60 sm:grid-cols-[3rem_minmax(0,1fr)_7rem_6rem_5rem_5rem] sm:px-5 ${top ? 'py-4' : 'py-3'} ${entry.me ? 'shadow-[inset_2px_0_0_theme(colors.gold.400)]' : ''}`}>
                          <span className={`font-mono tabular-nums ${top ? 'text-2xl' : 'text-sm'} ${entry.rank === 1 ? 'text-gold-ink' : top ? 'text-t1' : 'text-t4'}`}>{entry.rank}</span>
                          <span className="flex min-w-0 items-center gap-3">
                            <Avatar member={entry.member} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate text-t1">{entry.member.displayName}{entry.me && <span className="text-t4"> · toi</span>}</span>
                              <span className="font-mono text-xs text-t4 sm:hidden">N{entry.level.number} {entry.level.name} · {plural(entry.challenges, 'challenge')}</span>
                            </span>
                          </span>
                          <span className="hidden sm:block"><LevelChip level={entry.level} /></span>
                          <span className="hidden text-right font-mono text-sm tabular-nums text-t3 sm:block">{entry.challenges}</span>
                          <span className="hidden text-right font-mono text-xs tabular-nums text-t4 sm:block">{gap == null ? '–' : `−${gap}`}</span>
                          <span className={`text-right font-mono tabular-nums text-t1 ${top ? 'text-lg' : 'text-sm'}`}>{entry.totalScore}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <Pagination page={page} totalPages={ranking.data?.totalPages ?? 0} onPageChange={(value) => { const next = new URLSearchParams(params); if (value === 1) next.delete('page'); else next.set('page', String(value)); setParams(next); }} />
            </div>
          )}
          <MyPosition period={period} page={list} />
        </div>

        <p className="mt-10 max-w-prose text-sm leading-relaxed text-t4">
          Le classement général additionne les scores techniques des réponses notées. Celui de la semaine ne compte que les notes reçues depuis lundi. Les votes de la communauté n’entrent pas dans le calcul.
        </p>
      </div>
    </CrackLabLayout>
  );
}
