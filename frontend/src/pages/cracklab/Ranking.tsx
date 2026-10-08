import { useSearchParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';

import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const PAGE_SIZE = 25;

/** Ranked on the technical score only: the sum over graded answers. Votes are shown elsewhere, never counted here. */
export default function Ranking() {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const ranking = useApi((signal) => api.cracklab.ranking(page - 1, PAGE_SIZE, signal), [page]);
  const list = ranking.data?.content ?? [];

  return (
    <CrackLabLayout>
      <SEO title="Classement · CrackLab" description="Le classement CrackLab : la somme des scores techniques obtenus sur les challenges d’ingénierie." url="/cracklab/classement" />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="kicker font-mono">// classement</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-t1 sm:text-5xl">Les meilleurs cracks</h1>
        <p className="mt-4 text-base leading-relaxed text-t3">La somme des scores techniques sur les réponses notées. Les votes de la communauté n’entrent pas dans ce calcul.</p>

        <div className="mt-10">
          {ranking.loading && !list.length ? (
            <div role="status" className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}<span className="sr-only">Chargement du classement…</span></div>
          ) : ranking.error ? (
            <ErrorState title="Le classement est momentanément indisponible." message={ranking.error.message} onRetry={ranking.reload} />
          ) : !list.length ? (
            <EmptyState icon={<Trophy className="h-8 w-8" aria-hidden />} title="Personne n’est encore classé." description="Le classement s’ouvre avec la première réponse notée." />
          ) : (
            <>
              <ol className="divide-y divide-line-soft rounded-lg border border-line bg-noir-900">
                {list.map((entry) => (
                  <li key={entry.rank} className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${entry.me ? 'bg-gold-400/[0.07]' : ''}`}>
                    <span className={`w-8 shrink-0 font-mono text-lg font-bold tabular-nums ${entry.rank <= 3 ? 'text-gold-ink' : 'text-t4'}`}>{entry.rank}</span>
                    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-noir-800 text-sm font-semibold text-t2">
                      {entry.member.avatarUrl ? <img src={entry.member.avatarUrl} alt="" className="h-full w-full object-cover" /> : entry.member.displayName.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-t1">{entry.member.displayName}{entry.me && <span className="font-normal text-t4"> (toi)</span>}</span>
                      <span className="block text-xs text-t4">{entry.challenges} challenge{entry.challenges > 1 ? 's' : ''} noté{entry.challenges > 1 ? 's' : ''}</span>
                    </span>
                    <span className="font-mono text-lg font-bold tabular-nums text-t1">{entry.totalScore}<span className="text-xs font-normal text-t4"> pts</span></span>
                  </li>
                ))}
              </ol>
              <Pagination page={page} totalPages={ranking.data?.totalPages ?? 0} onPageChange={(value) => { const next = new URLSearchParams(params); if (value === 1) next.delete('page'); else next.set('page', String(value)); setParams(next); }} />
            </>
          )}
        </div>
      </div>
    </CrackLabLayout>
  );
}
