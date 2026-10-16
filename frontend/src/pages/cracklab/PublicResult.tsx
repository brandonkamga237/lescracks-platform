import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Lock } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { challengePath, memberPath, resultPath } from '@/lib/cracklab';
import { api } from '@/services/api';

const gradedFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/** Where a shared score lands: who, the score, and the way in to try the same challenge. */
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
          <ErrorState title={result.error.status === 404 ? 'Ce résultat est introuvable.' : 'Impossible de charger ce résultat.'} message={result.error.status === 404 ? 'Le défi n’est peut-être plus publié.' : result.error.message} onRetry={result.error.status === 404 ? undefined : result.reload} />
          <Link to="/cracklab" className="link mt-6 inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les défis</Link>
        </div>
      </CrackLabLayout>
    );
  }
  if (!data) {
    return <CrackLabLayout><div role="status" className="mx-auto max-w-3xl space-y-4 px-5 py-14 sm:px-8"><Skeleton className="h-72" /><Skeleton className="h-28" /><span className="sr-only">Chargement du résultat…</span></div></CrackLabLayout>;
  }

  const { challenge, author } = data;
  const graded = data.status === 'GRADED' && data.score != null;
  const headline = graded ? `${author.displayName} a obtenu ${data.score} pts` : `${author.displayName} a relevé ce défi`;

  return (
    <CrackLabLayout>
      <SEO title={`${headline} · CrackLab`} description={`Défi « ${challenge.title} ». Relève le même défi à ton tour.`} url={resultPath(data.submissionId)} />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <article className="rounded-lg border border-line bg-noir-900 p-6 sm:p-8">
          <Link to={memberPath(author.id)} className="group inline-flex items-center gap-3">
            <Avatar member={author} size="md" />
            <span className="text-t1 transition-colors duration-150 group-hover:text-gold-ink">{author.displayName}</span>
          </Link>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-t4"><Difficulty value={challenge.difficulty} /><span>{challenge.category}</span></p>
          <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-tight text-t1 sm:text-4xl">{challenge.title}</h1>

          {graded ? (
            <p className="mt-8 font-display text-7xl font-bold leading-none tracking-tight tabular-nums text-gold-ink">
              {data.score}<span className="ml-2 text-2xl font-medium text-t3">pts</span>
            </p>
          ) : (
            <p className="mt-8 inline-flex items-center gap-2 text-t3"><Clock3 className="h-4 w-4" aria-hidden />Réponse envoyée, en cours de notation.</p>
          )}
          {graded && data.gradedAt && <p className="mt-3 text-sm text-t4">Noté le {gradedFormat.format(new Date(data.gradedAt))}</p>}
        </article>

        <section className="mt-6 flex flex-col gap-5 rounded-lg border border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="font-medium text-t1">À toi de jouer.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to={challengePath(challenge.slug)} className="btn-primary">{challenge.answered ? 'Voir mon résultat' : 'Relever ce défi'}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            {!isLoading && !isSignedIn && <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer mon compte</Link>}
            <ShareButton className="sm:w-fit" title={headline} path={resultPath(data.submissionId)} label="Partager"
              text={graded ? `${headline} sur « ${challenge.title} ». À toi :` : `${headline} « ${challenge.title} ». À toi :`} />
          </div>
        </section>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-t4"><Lock className="h-3.5 w-3.5" aria-hidden />La réponse reste privée : seul le score est partagé.</p>
      </div>
    </CrackLabLayout>
  );
}
