import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';

import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import LineArt from '@/components/illustrations/LineArt';
import { useApi } from '@/hooks/useApi';
import { challengePath } from '@/lib/cracklab';
import { api } from '@/services/api';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default function MySubmissions() {
  const mine = useApi((signal) => api.cracklab.mine(signal), []);
  const list = mine.data ?? [];
  const graded = list.filter((submission) => submission.status === 'GRADED');
  const total = graded.reduce((sum, submission) => sum + (submission.technicalScore ?? 0), 0);

  return (
    <CrackLabLayout>
      <SEO title="Mes réponses · CrackLab" description="Tes réponses aux challenges CrackLab et leurs notes." url="/cracklab/mes-reponses" />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="kicker font-mono">// mes réponses</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-t1 sm:text-5xl">Ton parcours</h1>
        {graded.length > 0 && <p className="mt-4 font-mono text-sm text-t3">{total} points sur {graded.length} challenge{graded.length > 1 ? 's' : ''} noté{graded.length > 1 ? 's' : ''}</p>}

        <div className="mt-10">
          {mine.loading && !list.length ? (
            <div role="status" className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}<span className="sr-only">Chargement de tes réponses…</span></div>
          ) : mine.error ? (
            <ErrorState title="Tes réponses sont momentanément indisponibles." message={mine.error.message} onRetry={mine.reload} />
          ) : !list.length ? (
            <EmptyState icon={<LineArt motif="path" className="h-20 text-gold-400" />} title="Pas encore de réponse." description="Choisis un premier challenge : ta note et les autres réponses s’ouvriront juste après."
              action={<Link to="/cracklab" className="btn-primary">Voir les challenges</Link>} />
          ) : (
            <ul className="space-y-3">
              {list.map((submission) => (
                <li key={submission.id}>
                  <Link to={challengePath(submission.challengeSlug)} className="group flex items-center gap-4 rounded-lg border border-line bg-noir-900 p-4 transition-colors hover:border-gold-400/40 sm:p-5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-t1 group-hover:text-gold-ink">{submission.challengeTitle}</span>
                      <span className="mt-1 block text-xs text-t4">Envoyée le {dateFormat.format(new Date(submission.createdAt))} · {submission.wordCount} mots · {submission.voteScore} vote{Math.abs(submission.voteScore) > 1 ? 's' : ''}</span>
                    </span>
                    {submission.status === 'GRADED'
                      ? <span className="font-mono text-lg font-bold tabular-nums text-gold-ink">{submission.technicalScore}<span className="text-xs font-normal text-t4"> / {submission.totalPoints}</span></span>
                      : <span className="inline-flex items-center gap-1.5 text-xs text-t3"><Clock3 className="h-3.5 w-3.5" aria-hidden />En attente</span>}
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-t4 group-hover:text-gold-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </CrackLabLayout>
  );
}
