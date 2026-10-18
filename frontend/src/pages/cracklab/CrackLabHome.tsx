import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

import ChallengeRow from '@/components/cracklab/ChallengeRow';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import PuzzleArt from '@/components/cracklab/PuzzleArt';
import FilterChips from '@/components/common/FilterChips';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { useCrackLabProgress } from '@/hooks/useCrackLabProgress';
import { useSession } from '@/hooks/useSession';
import { DIFFICULTY_LABEL, challengePath } from '@/lib/cracklab';
import { worthFiltering } from '@/lib/filters';
import { api } from '@/services/api';
import type { ChallengeDifficulty, ChallengeSummary, CrackLabProgress } from '@/services/types';

const DIFFICULTIES = (Object.keys(DIFFICULTY_LABEL) as ChallengeDifficulty[]).map((value) => [value, DIFFICULTY_LABEL[value]] as [ChallengeDifficulty, string]);
type Status = 'todo' | 'done';
const STATUSES: Array<[Status, string]> = [['todo', 'À relever'], ['done', 'Relevés']];

/** The next challenge to take: unanswered, at the member's level when one fits. */
function recommend(list: ChallengeSummary[], progress: CrackLabProgress | null): ChallengeSummary | undefined {
  const open = list.filter((challenge) => !challenge.answered);
  if (!progress) return open[0];
  const target: ChallengeDifficulty = progress.level.number <= 2 ? 'BEGINNER' : progress.level.number <= 4 ? 'INTERMEDIATE' : 'ADVANCED';
  return open.find((challenge) => challenge.difficulty === target) ?? open[0];
}

interface FeaturedProps {
  challenge: ChallengeSummary;
  label: string;
}

/** The one challenge the page is about: big enough to be the obvious next step. */
function Featured({ challenge, label }: FeaturedProps) {
  return (
    <Link to={challengePath(challenge.slug)}
      className="group mt-8 block max-w-2xl rounded-lg border border-line bg-noir-900 p-6 transition-colors duration-150 hover:border-gold-400/50 focus-visible:border-gold-400 focus-visible:outline-none sm:p-8">
      <span className="font-mono text-xs text-gold-ink">{label}</span>
      <span className="mt-3 block text-balance font-display text-2xl font-bold leading-tight tracking-tight text-t1 sm:text-3xl">{challenge.title}</span>
      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-t4">
        <Difficulty value={challenge.difficulty} />
        <span>{challenge.category}</span>
      </span>
      <span className="btn-primary mt-6 inline-flex">Relever le défi<ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden /></span>
    </Link>
  );
}

export default function CrackLabHome() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const { isLoading, isSignedIn } = useSession();
  const { progress, playing } = useCrackLabProgress();
  const difficulty = DIFFICULTIES.find(([value]) => value === params.get('niveau'))?.[0];
  const tag = params.get('tag') ?? undefined;
  const status = STATUSES.find(([value]) => value === params.get('statut'))?.[0];
  const challenges = useApi((signal) => api.cracklab.challenges({ difficulty, tag, size: 50 }, signal), [difficulty, tag, isSignedIn]);
  const allChallenges = useApi((signal) => api.cracklab.challenges({ size: 100 }, signal), [isSignedIn]);
  const everything = useMemo(() => allChallenges.data?.content ?? [], [allChallenges.data]);
  const next = useMemo(() => recommend(everything, playing ? progress : null), [playing, everything, progress]);
  const allDone = playing && everything.length > 0 && everything.every((challenge) => challenge.answered);
  const list = (challenges.data?.content ?? []).filter((challenge) => !status || (status === 'done') === Boolean(challenge.answered));
  const filtered = Boolean(difficulty || tag || status);

  function setParam(key: string, value: string | null) {
    const nextParams = new URLSearchParams(params);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setParams(nextParams, { replace: true });
  }

  return (
    <CrackLabLayout>
      <SEO title="CrackLab · Casse-têtes et défis de réflexion" description="Des casse-têtes concrets à résoudre en raisonnant : propose ta solution, reçois un retour détaillé et compare-la à celles des autres." url="/cracklab" />

      <section className="border-b border-line-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            <h1 className="max-w-xl text-balance font-display text-3xl font-bold leading-[1.05] tracking-tight text-t1 sm:text-4xl">
              Des casse-têtes pour muscler ta réflexion.
            </h1>
            {!isSignedIn && <p className="mt-4 max-w-md text-base leading-relaxed text-t3">Pas besoin d’être expert : chaque défi se résout en raisonnant.</p>}

            {allChallenges.loading && !allChallenges.data ? (
              <Skeleton className="mt-8 h-56 max-w-2xl rounded-lg" />
            ) : allDone ? (
              <p className="mt-8 max-w-xl border-l-2 border-gold-400 pl-4 text-t2">Tout est relevé. Le prochain défi arrive bientôt.</p>
            ) : next ? (
              <Featured challenge={next} label={playing && everything.some((challenge) => challenge.answered) ? 'À relever ensuite' : 'Le défi du moment'} />
            ) : null}

            {!isLoading && !isSignedIn && (
              <p className="mt-5 text-sm text-t4">
                <Link to="/inscription" state={{ from: pathname }} className="link">Crée ton compte</Link> pour envoyer ta réponse.
              </p>
            )}
          </div>
          <PuzzleArt className="mx-auto hidden h-auto w-full max-w-xs lg:block" />
        </div>
      </section>

      <section id="challenges" aria-labelledby="challenges-heading" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-3xl">
          <h2 id="challenges-heading" className="font-display text-2xl font-bold tracking-tight text-t1">Tous les défis</h2>
          {worthFiltering(everything.length, filtered) && (
            <div className="mt-4 flex flex-col gap-1">
              {playing && <FilterChips legend="Statut" allLabel="Tous" options={STATUSES} value={status} onChange={(value) => setParam('statut', value ?? null)} />}
              <FilterChips legend="Niveau" allLabel="Tous niveaux" options={DIFFICULTIES} value={difficulty} onChange={(value) => setParam('niveau', value ?? null)} />
            </div>
          )}
          {tag && (
            <button type="button" onClick={() => setParam('tag', null)} className="mt-4 inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-xs text-t1">
              {tag}<X className="h-3 w-3" aria-label="Retirer le filtre" />
            </button>
          )}

          <div className="mt-6" aria-live="polite" aria-busy={challenges.loading}>
            {challenges.loading && !challenges.data ? (
              <div role="status" className="space-y-px">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}<span className="sr-only">Chargement des défis…</span></div>
            ) : challenges.error ? (
              <ErrorState title="Les défis sont momentanément indisponibles." message={challenges.error.message} onRetry={challenges.reload} />
            ) : list.length ? (
              <ul className={`divide-y divide-line-soft overflow-hidden rounded-lg border border-line ${challenges.loading ? 'opacity-60' : ''}`}>
                {list.map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} />)}
              </ul>
            ) : (
              <EmptyState
                icon={<PuzzleArt glyphs={false} className="h-24 w-auto" />}
                title={status === 'todo' && !difficulty && !tag ? 'Tout est relevé.' : filtered ? 'Aucun défi pour ces filtres.' : 'Le premier défi arrive.'}
                description={status === 'todo' && !difficulty && !tag ? 'Le prochain arrive bientôt.' : filtered ? 'Essaie un autre niveau.' : 'Les défis seront publiés ici.'}
              />
            )}
          </div>
        </div>
      </section>
    </CrackLabLayout>
  );
}
