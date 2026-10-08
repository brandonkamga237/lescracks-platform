import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, Swords, X } from 'lucide-react';

import ChallengeCard from '@/components/cracklab/ChallengeCard';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import ProgressPanel from '@/components/cracklab/ProgressPanel';
import RankingMini from '@/components/cracklab/RankingMini';
import FilterChips from '@/components/common/FilterChips';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import LineArt from '@/components/illustrations/LineArt';
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
  ['01', 'Lis l’énoncé', 'Un vrai problème d’ingénierie, son contexte et ses contraintes.'],
  ['02', 'Rédige ta solution', 'Argumente tes choix dans la limite de mots indiquée.'],
  ['03', 'Reçois ta note', 'Un score sur une grille connue d’avance, avec un commentaire par critère.'],
  ['04', 'Grimpe au classement', 'Gagne de l’XP, monte de niveau, garde ta série chaque semaine.'],
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
    <Link to={challengePath(challenge.slug)} className="group mt-8 flex max-w-xl items-center gap-4 rounded-lg border border-gold-400/40 bg-gold-400/[0.06] p-4 transition-colors hover:bg-gold-400/10 sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400 text-black"><Swords className="h-5 w-5" aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">Ton prochain challenge</span>
        <span className="mt-1 block truncate font-display text-lg font-bold text-t1">{challenge.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-t4">
          <Difficulty value={challenge.difficulty} />
          {challenge.submissionCount ? `${plural(challenge.submissionCount, 'participant')} · record ${challenge.bestScore ?? '—'}/${challenge.totalPoints}` : 'Aucune réponse encore'}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-gold-ink transition-transform group-hover:translate-x-0.5" aria-hidden />
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
  const challenges = useApi((signal) => api.cracklab.challenges({ difficulty, category, tag, size: 24 }, signal), [difficulty, category, tag, isSignedIn]);
  // Categories come from the published challenges themselves, so a filter never leads to nothing.
  const allChallenges = useApi((signal) => api.cracklab.challenges({ size: 100 }, signal), [isSignedIn]);
  const everything = useMemo(() => allChallenges.data?.content ?? [], [allChallenges.data]);
  const categories = useMemo(() => Array.from(new Set(everything.map((item) => item.category))).sort()
    .map((value) => [value, value] as [string, string]), [everything]);
  const next = useMemo(() => (playing ? recommend(everything, progress) : undefined), [playing, everything, progress]);
  const answers = everything.reduce((sum, challenge) => sum + challenge.submissionCount, 0);
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
      <SEO title="CrackLab · Challenges d’ingénierie" description="Des problèmes d’ingénierie réels : rédige ta solution, reçois une note critère par critère et grimpe au classement." url="/cracklab" />

      <section className="relative overflow-hidden border-b border-line-soft">
        {/* A faint engineering grid: the lab's texture, never louder than the text on it. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-20">
          <div className="min-w-0">
            <p className="kicker font-mono">// défis d’ingénierie</p>
            <h1 className="mt-5 text-balance font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight text-t1 sm:text-6xl lg:text-[4.25rem] lg:leading-[0.92]">
              {progress?.answered ? <>Content de te revoir. <span className="text-gold-ink">On remet ça ?</span></> : <>Résous de vrais problèmes. <span className="text-gold-ink">Fais-toi noter.</span></>}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-t3">
              Chaque challenge est noté sur une grille publique. Plusieurs solutions sont possibles : ce qui compte, c’est ton raisonnement.
            </p>
            {everything.length > 0 && (
              <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-t4">
                <span><span className="font-bold text-t1">{everything.length}</span> challenge{everything.length > 1 ? 's' : ''}</span>
                <span><span className="font-bold text-t1">{answers}</span> réponse{answers > 1 ? 's' : ''} notée{answers > 1 ? 's' : ''} ou en cours</span>
              </p>
            )}
            {next ? <NextChallenge challenge={next} /> : playing && progress?.answered && everything.length > 0 ? (
              <p className="mt-8 max-w-xl rounded-lg border border-line bg-noir-900 p-4 text-sm text-t2">Tu as relevé tous les challenges publiés. Le prochain arrive : garde ta série en revenant cette semaine.</p>
            ) : !isLoading && !isSignedIn ? (
              <div className="mt-8 flex flex-wrap gap-2">
                <a href="#challenges" className="btn-primary">Voir les challenges<ArrowRight className="h-4 w-4" aria-hidden /></a>
                <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer mon compte</Link>
              </div>
            ) : <a href="#challenges" className="btn-primary mt-8">Voir les challenges<ArrowRight className="h-4 w-4" aria-hidden /></a>}
          </div>

          {playing ? (
            progress ? <ProgressPanel progress={progress} /> : <Skeleton className="h-80 rounded-xl" />
          ) : (
            <ol className="grid gap-3">
              {STEPS.map(([number, title, body]) => (
                <li key={number} className="flex gap-4 rounded-lg border border-line bg-noir-900/80 p-4 backdrop-blur-sm">
                  <span className="font-mono text-sm font-bold text-gold-ink">{number}</span>
                  <span><span className="block font-semibold text-t1">{title}</span><span className="mt-1 block text-sm text-t3">{body}</span></span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div id="challenges" className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-labelledby="challenges-heading" className="min-w-0">
          <h2 id="challenges-heading" className="font-display text-3xl font-bold tracking-tight text-t1 sm:text-4xl">Les challenges</h2>
          <div className="mt-6 flex flex-col gap-2">
            {playing && <FilterChips legend="Statut" allLabel="Tous" options={STATUSES} value={status} onChange={(value) => setParam('statut', value ?? null)} />}
            <FilterChips legend="Niveau" allLabel="Tous niveaux" options={DIFFICULTIES} value={difficulty} onChange={(value) => setParam('niveau', value ?? null)} />
            {categories.length > 1 && <FilterChips legend="Catégorie" allLabel="Toutes catégories" options={categories} value={category} onChange={(value) => setParam('categorie', value ?? null)} />}
          </div>
          {tag && (
            <button type="button" onClick={() => setParam('tag', null)} className="mt-4 inline-flex items-center gap-1.5 rounded bg-noir-800 px-2.5 py-1 font-mono text-xs text-t1">
              tag : {tag}<X className="h-3 w-3" aria-label="Retirer le filtre" />
            </button>
          )}

          <div className="mt-8" aria-live="polite" aria-busy={challenges.loading}>
            {challenges.loading && !challenges.data ? (
              <div role="status" className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}<span className="sr-only">Chargement des challenges…</span></div>
            ) : challenges.error ? (
              <ErrorState title="Les challenges sont momentanément indisponibles." message={challenges.error.message} onRetry={challenges.reload} />
            ) : list.length ? (
              <ul className={`grid gap-4 sm:grid-cols-2 ${challenges.loading ? 'opacity-60' : ''}`}>
                {list.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}
              </ul>
            ) : (
              <EmptyState
                icon={<LineArt motif="code" className="h-20 text-gold-400" />}
                title={status === 'todo' && !difficulty && !category && !tag ? 'Tout est relevé.' : filtered ? 'Aucun challenge pour ces filtres.' : 'Le premier challenge arrive.'}
                description={status === 'todo' && !difficulty && !category && !tag ? 'Le prochain challenge arrive bientôt. En attendant, va voir le classement.' : filtered ? 'Essaie un autre niveau ou une autre catégorie.' : 'Les défis seront publiés ici. Reviens bientôt.'}
              />
            )}
          </div>
        </section>

        <aside aria-labelledby="top-heading" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <RankingMini />
          <div className="rounded-lg border border-line bg-noir-900 p-5">
            <p className="font-display text-lg font-bold text-t1">Défie tes amis</p>
            <p className="mt-1 text-sm text-t3">Envoie-leur CrackLab et comparez vos scores chaque semaine.</p>
            <ShareButton className="mt-4" title="CrackLab" path="/cracklab" label="Inviter des amis"
              text="Des challenges d’ingénierie notés sur 100, un classement chaque semaine. Viens te mesurer à moi sur CrackLab :" />
          </div>
        </aside>
      </div>
    </CrackLabLayout>
  );
}
