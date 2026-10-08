import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

import ChallengeRow from '@/components/cracklab/ChallengeRow';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import ProgressPanel from '@/components/cracklab/ProgressPanel';
import RankingMini from '@/components/cracklab/RankingMini';
import Schematic from '@/components/cracklab/Schematic';
import FilterChips from '@/components/common/FilterChips';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { useCrackLabProgress } from '@/hooks/useCrackLabProgress';
import { useSession } from '@/hooks/useSession';
import { DIFFICULTY_LABEL, challengePath, plural } from '@/lib/cracklab';
import { api } from '@/services/api';
import type { ChallengeDifficulty, ChallengeSummary, CrackLabProgress } from '@/services/types';

const DIFFICULTIES = (Object.keys(DIFFICULTY_LABEL) as ChallengeDifficulty[]).map((value) => [value, DIFFICULTY_LABEL[value]] as [ChallengeDifficulty, string]);
type Status = 'todo' | 'done';
const STATUSES: Array<[Status, string]> = [['todo', 'À relever'], ['done', 'Relevés']];

const STEPS = [
  ['01', 'Lis l’énoncé', 'Un problème réel, ses contraintes, sa grille.'],
  ['02', 'Argumente', 'Ta solution et tes compromis, en un nombre de mots limité.'],
  ['03', 'Reçois ta note', 'Critère par critère, avec un commentaire.'],
  ['04', 'Compare', 'Solution de référence, réponses des autres, classement.'],
] as const;

/** The next challenge to take: unanswered, at the member's level when one fits. */
function recommend(list: ChallengeSummary[], progress: CrackLabProgress | null): ChallengeSummary | undefined {
  const open = list.filter((challenge) => !challenge.answered);
  if (!progress) return open[0];
  const target: ChallengeDifficulty = progress.level.number <= 2 ? 'BEGINNER' : progress.level.number <= 4 ? 'INTERMEDIATE' : 'ADVANCED';
  return open.find((challenge) => challenge.difficulty === target) ?? open[0];
}

function NextChallenge({ challenge }: { challenge: ChallengeSummary }) {
  return (
    <Link to={challengePath(challenge.slug)} className="group mt-8 grid max-w-xl grid-cols-[minmax(0,1fr)_auto] items-center sm:grid-cols-[6rem_minmax(0,1fr)_auto] gap-4 rounded-lg border border-line p-3 pr-4 transition-colors duration-150 hover:border-line-strong">
      <span className="hidden overflow-hidden rounded border border-line-soft bg-noir-950 sm:block">
        <Schematic seed={challenge.slug} category={challenge.category} labels={false} className="block h-auto w-full" />
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-gold-ink">À relever ensuite</span>
        <span className="mt-1 block truncate font-medium text-t1">{challenge.title}</span>
        <span className="mt-1 flex items-center gap-3 text-xs text-t4"><Difficulty value={challenge.difficulty} /><span className="font-mono">{challenge.submissionCount ? plural(challenge.submissionCount, 'participant') : 'aucune réponse'}</span></span>
      </span>
      <ArrowRight className="h-4 w-4 text-t4 transition-colors duration-150 group-hover:text-gold-ink" aria-hidden />
    </Link>
  );
}

export default function CrackLabHome() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const { isLoading, isSignedIn } = useSession();
  const { progress, playing } = useCrackLabProgress();
  const difficulty = DIFFICULTIES.find(([value]) => value === params.get('niveau'))?.[0];
  const category = params.get('categorie') ?? undefined;
  const tag = params.get('tag') ?? undefined;
  const status = STATUSES.find(([value]) => value === params.get('statut'))?.[0];
  const challenges = useApi((signal) => api.cracklab.challenges({ difficulty, category, tag, size: 50 }, signal), [difficulty, category, tag, isSignedIn]);
  // Categories come from the published challenges themselves, so a filter never leads to nothing.
  const allChallenges = useApi((signal) => api.cracklab.challenges({ size: 100 }, signal), [isSignedIn]);
  const everything = useMemo(() => allChallenges.data?.content ?? [], [allChallenges.data]);
  const categories = useMemo(() => Array.from(new Set(everything.map((item) => item.category))).sort()
    .map((value) => [value, value] as [string, string]), [everything]);
  const next = useMemo(() => (playing ? recommend(everything, progress) : undefined), [playing, everything, progress]);
  const latest = everything[0];
  const answers = everything.reduce((sum, challenge) => sum + challenge.submissionCount, 0);
  const done = everything.filter((challenge) => challenge.answered).length;
  const list = (challenges.data?.content ?? []).filter((challenge) => !status || (status === 'done') === Boolean(challenge.answered));
  const filtered = Boolean(difficulty || category || tag || status);

  function setParam(key: string, value: string | null) {
    const nextParams = new URLSearchParams(params);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setParams(nextParams, { replace: true });
  }

  return (
    <CrackLabLayout>
      <SEO title="CrackLab · Challenges d’ingénierie" description="Des problèmes d’ingénierie réels : rédige ta solution, reçois une note critère par critère et compare-la aux autres." url="/cracklab" />

      <section className="border-b border-line-soft">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          <div className="min-w-0">
            <p className="font-mono text-xs text-gold-ink">cracklab / challenges</p>
            <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.02] tracking-tight text-t1 sm:text-5xl">
              Des problèmes d’ingénierie, notés sur 100.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-t3 sm:text-lg">
              Un énoncé réel, une réponse argumentée, une note critère par critère sur une grille publique. Puis tu compares la tienne à celles des autres.
            </p>
            {everything.length > 0 && (
              <p className="mt-6 font-mono text-xs text-t4">
                {plural(everything.length, 'challenge')} · {plural(answers, 'réponse')}{playing ? ` · ${done}/${everything.length} relevés par toi` : ''}
              </p>
            )}
            {next ? <NextChallenge challenge={next} /> : !isLoading && !isSignedIn ? (
              <div className="mt-8 flex flex-wrap gap-2">
                <a href="#challenges" className="btn-primary">Voir les challenges<ArrowRight className="h-4 w-4" aria-hidden /></a>
                <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer mon compte</Link>
              </div>
            ) : playing && everything.length > 0 && done === everything.length ? (
              <p className="mt-8 max-w-xl border-l-2 border-gold-400 pl-4 text-sm text-t2">Tous les challenges publiés sont relevés. Le prochain arrive : reviens cette semaine pour garder ta série.</p>
            ) : null}
          </div>

          {playing ? (
            progress ? <ProgressPanel progress={progress} /> : <Skeleton className="h-80 rounded-lg" />
          ) : latest ? (
            <figure className="self-start rounded-lg border border-line bg-noir-900 p-4">
              <Schematic seed={latest.slug} category={latest.category} className="block h-auto w-full" />
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 border-t border-line-soft pt-3 text-xs">
                <span className="truncate text-t3">{latest.title}</span>
                <span className="shrink-0 font-mono text-t4">{latest.category.toLowerCase()}</span>
              </figcaption>
            </figure>
          ) : null}
        </div>

        {!playing && (
          <ol className="mx-auto grid max-w-7xl border-t border-line-soft sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([number, title, body]) => (
              <li key={number} className="border-line-soft px-5 py-5 sm:px-8 [&:not(:first-child)]:border-t sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l lg:border-t-0 lg:[&:not(:first-child)]:border-l">
                <span className="font-mono text-xs text-gold-ink">{number}</span>
                <span className="mt-2 block text-sm font-medium text-t1">{title}</span>
                <span className="mt-1 block text-sm text-t4">{body}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div id="challenges" className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-labelledby="challenges-heading" className="min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="challenges-heading" className="font-display text-2xl font-bold tracking-tight text-t1 sm:text-3xl">Les challenges</h2>
            {challenges.data && <span className="font-mono text-xs text-t4">{list.length}</span>}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {playing && <FilterChips legend="Statut" allLabel="Tous" options={STATUSES} value={status} onChange={(value) => setParam('statut', value ?? null)} />}
            <FilterChips legend="Niveau" allLabel="Tous niveaux" options={DIFFICULTIES} value={difficulty} onChange={(value) => setParam('niveau', value ?? null)} />
            {categories.length > 1 && <FilterChips legend="Catégorie" allLabel="Toutes catégories" options={categories} value={category} onChange={(value) => setParam('categorie', value ?? null)} />}
          </div>
          {tag && (
            <button type="button" onClick={() => setParam('tag', null)} className="mt-4 inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-xs text-t1">
              tag : {tag}<X className="h-3 w-3" aria-label="Retirer le filtre" />
            </button>
          )}

          <div className="mt-6" aria-live="polite" aria-busy={challenges.loading}>
            {challenges.loading && !challenges.data ? (
              <div role="status" className="space-y-px">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}<span className="sr-only">Chargement des challenges…</span></div>
            ) : challenges.error ? (
              <ErrorState title="Les challenges sont momentanément indisponibles." message={challenges.error.message} onRetry={challenges.reload} />
            ) : list.length ? (
              <div className={`overflow-hidden rounded-lg border border-line ${challenges.loading ? 'opacity-60' : ''}`}>
                <div aria-hidden className="hidden grid-cols-[6rem_minmax(0,1fr)_4.5rem_4.5rem_4.5rem_5.5rem] gap-x-4 border-b border-line-soft bg-noir-900 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-t4 sm:grid">
                  <span className="col-span-2">Challenge</span><span className="text-right">Part.</span><span className="text-right">Moy.</span><span className="text-right">Record</span><span className="text-right">Toi</span>
                </div>
                <ul className="divide-y divide-line-soft">
                  {list.map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} />)}
                </ul>
              </div>
            ) : (
              <EmptyState
                icon={<Schematic seed="vide" category="architecture" labels={false} className="h-20 w-auto" />}
                title={status === 'todo' && !difficulty && !category && !tag ? 'Tout est relevé.' : filtered ? 'Aucun challenge pour ces filtres.' : 'Le premier challenge arrive.'}
                description={status === 'todo' && !difficulty && !category && !tag ? 'Le prochain challenge arrive bientôt.' : filtered ? 'Essaie un autre niveau ou une autre catégorie.' : 'Les défis seront publiés ici.'}
              />
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Classement et invitation">
          <RankingMini />
          <div className="rounded-lg border border-line bg-noir-900 p-5">
            <p className="font-medium text-t1">Défie quelqu’un</p>
            <p className="mt-1 text-sm text-t4">Envoie CrackLab et comparez vos scores chaque semaine.</p>
            <ShareButton className="mt-4" title="CrackLab" path="/cracklab" label="Inviter"
              text="Des challenges d’ingénierie notés sur 100, un classement chaque semaine. Viens te mesurer à moi sur CrackLab :" />
          </div>
        </aside>
      </div>
    </CrackLabLayout>
  );
}
