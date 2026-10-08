import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Timer, Trophy } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import LevelChip from '@/components/cracklab/LevelChip';
import Podium from '@/components/cracklab/Podium';
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
      <div className="flex items-center gap-3 rounded-lg border border-gold-400/40 bg-noir-900/95 p-3 shadow-gold backdrop-blur sm:p-4">
        <Avatar member={progress.member} size="md" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold text-t1">Ta position</span>
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
  const podium = page === 1 ? list.slice(0, 3) : [];
  const rest = page === 1 ? list.slice(3) : list;
  const week = period === 'week';
  const leader = list[0];

  function choose(next: RankingPeriod) {
    setParams(next === 'week' ? { periode: 'semaine' } : {}, { replace: true });
  }

  return (
    <CrackLabLayout>
      <SEO title={week ? 'Le podium de la semaine · CrackLab' : 'Classement · CrackLab'} description="Le classement CrackLab : la somme des scores techniques obtenus sur les challenges d’ingénierie." url={rankingPath(period)} />
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker font-mono">// classement</p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-t1 sm:text-5xl">{week ? 'Le podium de la semaine' : 'Les meilleurs cracks'}</h1>
            </div>
            <ShareButton className="w-full sm:w-auto" title={week ? 'Le podium de la semaine' : 'Classement CrackLab'} path={rankingPath(period)} label="Partager le classement"
              text={leader ? `${leader.member.displayName} mène ${week ? 'le classement de la semaine' : 'le classement CrackLab'} avec ${leader.totalScore} pts. Qui prend sa place ?` : 'Le classement CrackLab est encore libre. Viens prendre la première place :'} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Période" className="inline-grid grid-cols-2 gap-1 rounded-lg bg-noir-800 p-1">
              {([['week', 'Cette semaine'], ['all', 'Global']] as const).map(([value, label]) => (
                <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => choose(value)}
                  className={`min-h-10 rounded px-4 text-sm font-medium transition-colors ${period === value ? 'bg-noir-600 text-t1' : 'text-t3 hover:text-t1'}`}>{label}</button>
              ))}
            </div>
            <p className="flex items-center gap-1.5 font-mono text-xs text-t4">
              {week ? <><Timer className="h-3.5 w-3.5" aria-hidden />Remise à zéro dans {weekResetsIn()}</> : 'Somme des scores techniques'}
            </p>
          </div>

          <div className="mt-10">
            {ranking.loading && !list.length ? (
              <div role="status" className="space-y-2"><Skeleton className="h-56" />{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}<span className="sr-only">Chargement du classement…</span></div>
            ) : ranking.error ? (
              <ErrorState title="Le classement est momentanément indisponible." message={ranking.error.message} onRetry={ranking.reload} />
            ) : !list.length ? (
              <EmptyState icon={<Trophy className="h-8 w-8" aria-hidden />}
                title={week ? 'Personne n’a encore marqué cette semaine.' : 'Personne n’est encore classé.'}
                description={week ? 'Une réponse notée cette semaine suffit pour monter sur le podium.' : 'Le classement s’ouvre avec la première réponse notée.'}
                action={<Link to="/cracklab#challenges" className="btn-primary">Relever un challenge</Link>} />
            ) : (
              <div className={ranking.loading ? 'opacity-60' : ''}>
                {podium.length > 0 && <Podium entries={podium} />}
                {rest.length > 0 && (
                  <ol className={`divide-y divide-line-soft overflow-hidden rounded-lg border border-line bg-noir-900 ${podium.length ? 'mt-0 rounded-t-none' : ''}`}>
                    {rest.map((entry) => (
                      <li key={entry.member.id}>
                        <Link id={entry.me ? 'ranking-me' : undefined} to={memberPath(entry.member.id)} className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-noir-800 sm:gap-4 sm:px-5 ${entry.me ? 'bg-gold-400/[0.08]' : ''}`}>
                          <span className="w-8 shrink-0 font-mono text-base font-bold tabular-nums text-t4">{entry.rank}</span>
                          <Avatar member={entry.member} size="md" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-t1">{entry.member.displayName}{entry.me && <span className="font-normal text-t4"> (toi)</span>}</span>
                            <span className="mt-1 flex items-center gap-2 text-xs text-t4"><LevelChip level={entry.level} className="hidden sm:inline-flex" />{plural(entry.challenges, 'challenge')}</span>
                          </span>
                          <span className="font-mono text-lg font-bold tabular-nums text-t1">{entry.totalScore}<span className="text-xs font-normal text-t4"> pts</span></span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
                <Pagination page={page} totalPages={ranking.data?.totalPages ?? 0} onPageChange={(value) => { const next = new URLSearchParams(params); if (value === 1) next.delete('page'); else next.set('page', String(value)); setParams(next); }} />
              </div>
            )}
            <MyPosition period={period} page={list} />
          </div>

          <p className="mt-10 text-sm leading-relaxed text-t4">
            Le classement additionne les scores techniques des réponses notées. Le classement de la semaine ne compte que les notes reçues depuis lundi. Les votes de la communauté n’entrent pas dans le calcul.
          </p>
        </div>
      </div>
    </CrackLabLayout>
  );
}
