import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Lock } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import LevelChip from '@/components/cracklab/LevelChip';
import Schematic from '@/components/cracklab/Schematic';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { challengePath, fillClass, memberPath, ordinal, percentOf, resultPath } from '@/lib/cracklab';
import { api } from '@/services/api';

const gradedFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/** Where a shared score lands: who, how well, against how many, and the way in to try the same challenge. */
export default function PublicResult() {
  const { id = '' } = useParams();
  const { pathname } = useLocation();
  const { isLoading, isSignedIn } = useSession();
  const result = useApi((signal) => api.cracklab.result(Number(id), signal), [id]);
  const data = result.data;

  if (result.error) {
    return (
      <CrackLabLayout>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <ErrorState title={result.error.status === 404 ? 'Ce résultat est introuvable.' : 'Impossible de charger ce résultat.'} message={result.error.status === 404 ? 'Le challenge n’est peut-être plus publié.' : result.error.message} onRetry={result.error.status === 404 ? undefined : result.reload} />
          <Link to="/cracklab" className="link mt-6 inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les challenges</Link>
        </div>
      </CrackLabLayout>
    );
  }
  if (!data) {
    return <CrackLabLayout><div role="status" className="mx-auto max-w-3xl space-y-4 px-5 py-14 sm:px-8"><Skeleton className="h-72" /><Skeleton className="h-28" /><span className="sr-only">Chargement du résultat…</span></div></CrackLabLayout>;
  }

  const { challenge, author } = data;
  const graded = data.status === 'GRADED' && data.score != null;
  const percent = percentOf(data.score, data.totalPoints);
  const best = graded && data.rankOnChallenge === 1;
  const headline = graded ? `${author.displayName} a obtenu ${data.score}/${data.totalPoints}` : `${author.displayName} a relevé ce challenge`;

  const label = 'font-mono text-[11px] uppercase tracking-[0.08em] text-t4';
  const figures: Array<[string, string]> = [
    ['Position', graded && challenge.gradedCount > 1 ? `${ordinal(data.rankOnChallenge)} / ${challenge.gradedCount}` : '–'],
    ['Participants', String(challenge.submissionCount)],
    ['Moyenne', challenge.averageScore != null ? `${challenge.averageScore}/${challenge.totalPoints}` : '–'],
    ['Record', challenge.bestScore != null ? `${challenge.bestScore}/${challenge.totalPoints}` : '–'],
  ];

  return (
    <CrackLabLayout>
      <SEO title={`${headline} · CrackLab`} description={`Challenge « ${challenge.title} ». Relève le même défi et compare ton score.`} url={resultPath(data.submissionId)} />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs text-gold-ink">cracklab / résultat</p>

        <article className="mt-6 rounded-lg border border-line bg-noir-900">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
            <span className={label}>Relevé de note</span>
            {data.gradedAt && <span className="font-mono text-xs text-t4">{gradedFormat.format(new Date(data.gradedAt))}</span>}
          </div>

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
            <div className="min-w-0">
              <Link to={memberPath(author.id)} className="group inline-flex items-center gap-3">
                <Avatar member={author} size="md" />
                <span>
                  <span className="block text-t1 transition-colors duration-150 group-hover:text-gold-ink">{author.displayName}</span>
                  <LevelChip level={data.authorLevel} className="mt-1" />
                </span>
              </Link>
              <h1 className="mt-6 text-balance font-display text-3xl font-bold leading-tight tracking-tight text-t1 sm:text-4xl">{challenge.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-t4"><Difficulty value={challenge.difficulty} /><span className="font-mono">{challenge.category}</span></div>

              {graded ? (
                <div className="mt-8">
                  <p className="font-display text-6xl font-bold leading-none tracking-tight tabular-nums text-t1">
                    {data.score}<span className="text-2xl font-medium text-t4"> / {data.totalPoints}</span>
                  </p>
                  <div aria-hidden className="mt-4 h-0.5 max-w-md bg-line"><div className={`h-full bg-gold-400 ${fillClass(percent / 100)}`} /></div>
                  <p className="mt-3 text-sm text-t3">
                    {best && challenge.gradedCount > 1 ? <span className="text-gold-ink">Meilleure note du challenge.</span>
                      : challenge.gradedCount > 1 ? `Mieux que ${data.betterThanPercent} % des participants.` : `${percent} % des points.`}
                  </p>
                </div>
              ) : (
                <p className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-t3"><Clock3 className="h-4 w-4" aria-hidden />réponse envoyée, note en cours</p>
              )}
            </div>
            <figure className="self-start rounded border border-line-soft bg-noir-950 p-3">
              <Schematic seed={challenge.slug} category={challenge.category} className="block h-auto w-full" />
            </figure>
          </div>

          <dl className="grid grid-cols-2 border-t border-line-soft sm:grid-cols-4">
            {figures.map(([name, value], index) => (
              <div key={name} className={`px-5 py-4 ${index % 2 ? 'border-l border-line-soft' : ''} ${index > 1 ? 'border-t border-line-soft sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l' : ''}`}>
                <dt className={label}>{name}</dt>
                <dd className="mt-1 font-mono text-sm tabular-nums text-t1">{value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <section className="mt-6 flex flex-col gap-5 rounded-lg border border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-md">
            <p className="font-medium text-t1">{graded ? 'Tu ferais mieux ?' : 'À toi de jouer.'}</p>
            <p className="mt-1 text-sm text-t3">Même énoncé, même grille de {challenge.totalPoints} points, notée critère par critère.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to={challengePath(challenge.slug)} className="btn-primary">{challenge.answered ? 'Voir mon résultat' : 'Relever ce challenge'}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            {!isLoading && !isSignedIn && <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer mon compte</Link>}
            <ShareButton className="sm:w-auto" title={headline} path={resultPath(data.submissionId)} label="Partager"
              text={graded ? `${headline} sur « ${challenge.title} ». Tu ferais mieux ?` : `${headline} « ${challenge.title} ». À toi :`} />
          </div>
        </section>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-t4"><Lock className="h-3.5 w-3.5" aria-hidden />La réponse reste privée : seul le score est partagé.</p>
      </div>
    </CrackLabLayout>
  );
}
