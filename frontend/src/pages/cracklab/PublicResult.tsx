import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Crown, Lock, Users } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import CountUp from '@/components/cracklab/CountUp';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import LevelChip from '@/components/cracklab/LevelChip';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { challengePath, fillClass, memberPath, ordinal, percentOf, plural, resultPath } from '@/lib/cracklab';
import { api } from '@/services/api';

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

  return (
    <CrackLabLayout>
      <SEO title={`${headline} · CrackLab`} description={`Challenge « ${challenge.title} ». Relève le même défi et compare ton score.`} url={resultPath(data.submissionId)} />
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.18),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
          <article className="overflow-hidden rounded-xl border border-gold-400/30 bg-noir-900/90 shadow-gold-lg backdrop-blur-sm">
            <div className="p-6 sm:p-10">
              <Link to={memberPath(author.id)} className="group inline-flex items-center gap-3">
                <Avatar member={author} size="lg" />
                <span>
                  <span className="block font-semibold text-t1 group-hover:text-gold-ink">{author.displayName}</span>
                  <LevelChip level={data.authorLevel} className="mt-1" />
                </span>
              </Link>

              <p className="mt-8 text-sm text-t3">{graded ? 'a obtenu sur le challenge' : 'a relevé le challenge'}</p>
              <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-tight text-t1 sm:text-4xl">{challenge.title}</h1>

              {graded ? (
                <>
                  <p className="mt-8 flex items-baseline gap-2 font-display font-bold leading-none text-t1 motion-safe:animate-pop">
                    <CountUp value={data.score ?? 0} className="text-7xl sm:text-8xl" />
                    <span className="text-3xl text-t4">/ {data.totalPoints}</span>
                  </p>
                  <div aria-hidden className="mt-5 h-2.5 overflow-hidden rounded-full bg-noir-700">
                    <div className={`h-full origin-left rounded-full bg-gradient-to-r from-gold-500 to-gold-300 motion-safe:animate-grow-x ${fillClass(percent / 100)}`} />
                  </div>
                  <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
                    {best ? <span className="inline-flex items-center gap-1.5 font-semibold text-gold-ink"><Crown className="h-5 w-5" aria-hidden />Meilleur score du challenge</span>
                      : challenge.gradedCount > 1 ? <span className="font-semibold text-t1">Mieux que {data.betterThanPercent} % des participants</span> : null}
                    {challenge.gradedCount > 1 && <span className="font-mono text-sm text-t4">{ordinal(data.rankOnChallenge)} sur {challenge.gradedCount}</span>}
                  </p>
                </>
              ) : (
                <p className="mt-8 inline-flex items-center gap-2 rounded-lg bg-noir-800 px-4 py-3 text-sm text-t2"><Clock3 className="h-4 w-4 text-gold-ink" aria-hidden />Réponse envoyée, note en cours.</p>
              )}
            </div>

            <dl className="grid grid-cols-3 border-t border-line-soft bg-noir-950/40 text-center">
              {([
                ['Participants', String(challenge.submissionCount)],
                ['Moyenne', challenge.averageScore != null ? `${challenge.averageScore}/${challenge.totalPoints}` : '—'],
                ['Record', challenge.bestScore != null ? `${challenge.bestScore}/${challenge.totalPoints}` : '—'],
              ] as const).map(([label, value]) => (
                <div key={label} className="border-l border-line-soft px-2 py-4 first:border-l-0">
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-t4">{label}</dt>
                  <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-t1">{value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <section className="mt-8 rounded-xl border border-line bg-noir-900 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Difficulty value={challenge.difficulty} /><span className="label">{challenge.category}</span>
              <span className="inline-flex items-center gap-1 text-xs text-t4"><Users className="h-3.5 w-3.5" aria-hidden />{plural(challenge.submissionCount, 'participant')}</span></div>
            <p className="mt-4 font-display text-2xl font-bold tracking-tight text-t1">{graded ? 'Tu ferais mieux ?' : 'À toi de jouer.'}</p>
            <p className="mt-2 text-sm leading-relaxed text-t3">Le même énoncé, la même grille de {challenge.totalPoints} points. Ta réponse est notée critère par critère, puis tu compares ton score.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link to={challengePath(challenge.slug)} className="btn-primary">{challenge.answered ? 'Voir mon résultat' : 'Relever ce challenge'}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
              {!isLoading && !isSignedIn && <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer mon compte</Link>}
              <ShareButton className="sm:ml-auto sm:w-auto" title={headline} path={resultPath(data.submissionId)} label="Partager"
                text={graded ? `${headline} sur « ${challenge.title} ». Tu ferais mieux ?` : `${headline} « ${challenge.title} ». À toi :`} />
            </div>
          </section>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-t4"><Lock className="h-3.5 w-3.5" aria-hidden />La réponse reste privée : seul le score est partagé.</p>
        </div>
      </div>
    </CrackLabLayout>
  );
}
