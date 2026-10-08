import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

import ChallengeCard from '@/components/cracklab/ChallengeCard';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import FilterChips from '@/components/common/FilterChips';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import LineArt from '@/components/illustrations/LineArt';
import { useApi } from '@/hooks/useApi';
import { DIFFICULTY_LABEL } from '@/lib/cracklab';
import { api } from '@/services/api';
import type { ChallengeDifficulty } from '@/services/types';

const DIFFICULTIES = (Object.keys(DIFFICULTY_LABEL) as ChallengeDifficulty[]).map((value) => [value, DIFFICULTY_LABEL[value]] as [ChallengeDifficulty, string]);

const STEPS = [
  ['01', 'Lis l’énoncé', 'Un vrai problème d’ingénierie, son contexte et ses contraintes.'],
  ['02', 'Rédige ta solution', 'Argumente tes choix dans la limite de mots indiquée.'],
  ['03', 'Reçois ta note', 'Un score sur une grille connue d’avance, avec un commentaire par critère.'],
] as const;

export default function CrackLabHome() {
  const [params, setParams] = useSearchParams();
  const difficulty = DIFFICULTIES.find(([value]) => value === params.get('niveau'))?.[0];
  const category = params.get('categorie') ?? undefined;
  const tag = params.get('tag') ?? undefined;
  const challenges = useApi((signal) => api.cracklab.challenges({ difficulty, category, tag, size: 24 }, signal), [difficulty, category, tag]);
  // Categories come from the published challenges themselves, so a filter never leads to nothing.
  const allChallenges = useApi((signal) => api.cracklab.challenges({ size: 100 }, signal), []);
  const ranking = useApi((signal) => api.cracklab.ranking(0, 5, signal), []);
  const categories = useMemo(() => Array.from(new Set(allChallenges.data?.content.map((item) => item.category) ?? [])).sort()
    .map((value) => [value, value] as [string, string]), [allChallenges.data]);
  const list = challenges.data?.content ?? [];

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <CrackLabLayout>
      <SEO title="CrackLab · Challenges d’ingénierie" description="Des problèmes d’ingénierie réels : rédige ta solution, reçois une note critère par critère et compare-la aux autres réponses." url="/cracklab" />

      <section className="relative overflow-hidden border-b border-line-soft">
        {/* A faint engineering grid: the lab's texture, never louder than the text on it. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="kicker font-mono">// défis d’ingénierie</p>
            <h1 className="mt-5 text-balance font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight text-t1 sm:text-6xl lg:text-[4.25rem] lg:leading-[0.92]">
              Résous de vrais problèmes. <span className="text-gold-ink">Fais-toi noter.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-t3">
              Chaque challenge est noté sur une grille publique. Plusieurs solutions sont possibles : ce qui compte, c’est ton raisonnement.
            </p>
            <a href="#challenges" className="btn-primary mt-8">Voir les challenges<ArrowRight className="h-4 w-4" aria-hidden /></a>
          </div>
          <ol className="grid gap-3">
            {STEPS.map(([number, title, body]) => (
              <li key={number} className="flex gap-4 rounded-lg border border-line bg-noir-900/80 p-4 backdrop-blur-sm">
                <span className="font-mono text-sm font-bold text-gold-ink">{number}</span>
                <span><span className="block font-semibold text-t1">{title}</span><span className="mt-1 block text-sm text-t3">{body}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div id="challenges" className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="challenges-heading" className="min-w-0">
          <h2 id="challenges-heading" className="font-display text-3xl font-bold tracking-tight text-t1 sm:text-4xl">Les challenges</h2>
          <div className="mt-6 flex flex-col gap-2">
            <FilterChips legend="Niveau" allLabel="Tous niveaux" options={DIFFICULTIES} value={difficulty} onChange={(value) => setParam('niveau', value ?? null)} />
            {categories.length > 1 && <FilterChips legend="Catégorie" allLabel="Toutes catégories" options={categories} value={category} onChange={(value) => setParam('categorie', value ?? null)} />}
          </div>
          {tag && (
            <button type="button" onClick={() => setParam('tag', null)} className="mt-4 inline-flex items-center gap-1.5 rounded bg-noir-800 px-2.5 py-1 font-mono text-xs text-t1">
              tag : {tag}<X className="h-3 w-3" aria-label="Retirer le filtre" />
            </button>
          )}

          <div className="mt-8" aria-live="polite" aria-busy={challenges.loading}>
            {challenges.loading && !list.length ? (
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
                title={difficulty || category || tag ? 'Aucun challenge pour ces filtres.' : 'Le premier challenge arrive.'}
                description={difficulty || category || tag ? 'Essaie un autre niveau ou une autre catégorie.' : 'Les défis seront publiés ici. Reviens bientôt.'}
              />
            )}
          </div>
        </section>

        <aside aria-labelledby="top-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-line bg-noir-900 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="top-heading" className="font-display text-lg font-bold text-t1">Classement</h2>
              <Link to="/cracklab/classement" className="link text-xs">Tout voir</Link>
            </div>
            {ranking.data?.content.length ? (
              <ol className="mt-4 space-y-1">
                {ranking.data.content.map((entry) => (
                  <li key={entry.rank} className={`flex items-center gap-3 rounded px-2 py-2 text-sm ${entry.me ? 'bg-gold-400/10' : ''}`}>
                    <span className={`w-6 font-mono font-bold tabular-nums ${entry.rank <= 3 ? 'text-gold-ink' : 'text-t4'}`}>{entry.rank}</span>
                    <span className="min-w-0 flex-1 truncate text-t1">{entry.member.displayName}{entry.me && <span className="text-t4"> (toi)</span>}</span>
                    <span className="font-mono tabular-nums text-t2">{entry.totalScore}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-4 text-sm leading-relaxed text-t4">{ranking.loading ? 'Chargement…' : 'Personne n’est encore classé. La première réponse notée ouvre le classement.'}</p>}
          </div>
        </aside>
      </div>
    </CrackLabLayout>
  );
}
