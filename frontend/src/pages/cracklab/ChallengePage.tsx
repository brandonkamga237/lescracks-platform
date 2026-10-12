import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Eye, PenLine, Send } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import Prose from '@/components/cracklab/Prose';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { ErrorState } from '@/components/common/States';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useApi } from '@/hooks/useApi';
import { useCrackLabProgress } from '@/hooks/useCrackLabProgress';
import { useSession } from '@/hooks/useSession';
import { challengePath, memberPath, resultPath, wordCount } from '@/lib/cracklab';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { ChallengeDetail, ChallengeSubmission } from '@/services/types';

type Tab = 'resultat' | 'solution' | 'reponses' | 'enonce';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const label = 'font-mono text-xs text-t4';

// The draft lives in this browser only: losing a long answer to a closed tab is the worst outcome here.
const draftKey = (slug: string) => `lescracks.cracklab.draft.${slug}`;
function readDraft(slug: string) { try { return localStorage.getItem(draftKey(slug)) ?? ''; } catch { return ''; } }
function writeDraft(slug: string, text: string) { try { if (text) localStorage.setItem(draftKey(slug), text); else localStorage.removeItem(draftKey(slug)); } catch { /* storage blocked */ } }

/** Up and down arrows with the total between them; a member never votes on their own answer. */
function Votes({ submission, onVoted }: { submission: ChallengeSubmission; onVoted: (voteScore: number, myVote: -1 | 0 | 1) => void }) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  async function vote(value: -1 | 1) {
    const next = submission.myVote === value ? 0 : value;
    setBusy(true);
    setFailure('');
    try {
      const result = await api.cracklab.vote(submission.id, next);
      onVoted(result.voteScore, result.myVote);
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'Le vote n’a pas été pris en compte.');
    } finally {
      setBusy(false);
    }
  }

  const arrow = 'flex h-9 w-9 items-center justify-center rounded transition-colors disabled:opacity-40';
  return (
    <div className="flex flex-col items-center" title={failure || undefined}>
      <button type="button" disabled={busy || submission.mine} onClick={() => void vote(1)} aria-pressed={submission.myVote === 1}
        aria-label="Vote positif" className={`${arrow} ${submission.myVote === 1 ? 'bg-gold-400/15 text-gold-ink' : 'text-t4 hover:bg-noir-800 hover:text-t1'}`}>
        <ChevronUp className="h-5 w-5" aria-hidden />
      </button>
      <span className="font-mono text-sm font-semibold tabular-nums text-t1" aria-label={`${submission.voteScore} votes`}>{submission.voteScore}</span>
      <button type="button" disabled={busy || submission.mine} onClick={() => void vote(-1)} aria-pressed={submission.myVote === -1}
        aria-label="Vote négatif" className={`${arrow} ${submission.myVote === -1 ? 'bg-error/15 text-error-ink' : 'text-t4 hover:bg-noir-800 hover:text-t1'}`}>
        <ChevronDown className="h-5 w-5" aria-hidden />
      </button>
      {failure && <span role="alert" className="sr-only">{failure}</span>}
    </div>
  );
}

/** Another member's answer, read for its ideas: no score next to it. */
function AnswerCard({ submission, onVoted }: { submission: ChallengeSubmission; onVoted: (voteScore: number, myVote: -1 | 0 | 1) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="flex gap-3 rounded-lg border border-line bg-noir-900 p-4 sm:gap-5 sm:p-5">
      <Votes submission={submission} onVoted={onVoted} />
      <div className="min-w-0 flex-1">
        <Link to={memberPath(submission.author.id)} className="inline-flex items-center gap-2 text-sm font-semibold text-t1 hover:text-gold-ink">
          <Avatar member={submission.author} size="sm" />{submission.author.displayName}
          {submission.mine && <span className="rounded bg-gold-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-gold-ink">toi</span>}
        </Link>
        <p className="mt-0.5 text-xs text-t4">{dateFormat.format(new Date(submission.createdAt))}</p>
        <div className={`relative mt-4 ${open ? '' : 'max-h-56 overflow-hidden'}`}>
          <Prose text={submission.answer} compact />
          {!open && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-noir-900 to-transparent" />}
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="link mt-3 text-sm">{open ? 'Réduire' : 'Lire toute la réponse'}</button>
      </div>
    </li>
  );
}

/** The next unanswered challenge, so a finished one always leads somewhere. */
function NextUp({ current }: { current: string }) {
  const list = useApi((signal) => api.cracklab.challenges({ size: 100 }, signal), [current]);
  const next = list.data?.content.find((challenge) => !challenge.answered && challenge.slug !== current);
  if (!next) return null;
  return (
    <Link to={challengePath(next.slug)} className="group flex items-center gap-4 rounded-lg border border-line p-5 transition-colors duration-150 hover:border-gold-400/50">
      <span className="min-w-0 flex-1">
        <span className={label}>Défi suivant</span>
        <span className="mt-1 block font-medium text-t1">{next.title}</span>
        <span className="mt-1 flex items-center gap-3 text-xs text-t4"><Difficulty value={next.difficulty} /><span>{next.category}</span></span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-t4 transition-colors duration-150 group-hover:text-gold-ink" aria-hidden />
    </Link>
  );
}

const gradedFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/** A score and what the grader had to say. No rank, no percentage, no average: one number is enough. */
function Result({ submission, challenge }: { submission: ChallengeSubmission; challenge: ChallengeDetail }) {
  const graded = submission.status === 'GRADED';
  const notes = submission.evaluations.filter((evaluation) => evaluation.feedback?.trim());

  return (
    <div className="space-y-6">
      <section aria-labelledby="result-heading" className="rounded-lg border border-line bg-noir-900 p-6 sm:p-8">
        {graded ? (
          <>
            <h2 id="result-heading" className={label}>Ton score{submission.gradedAt ? ` · ${gradedFormat.format(new Date(submission.gradedAt))}` : ''}</h2>
            <p className="mt-3 font-display text-7xl font-bold leading-none tracking-tight tabular-nums text-gold-ink">
              {submission.technicalScore}<span className="ml-2 text-2xl font-medium text-t3">pts</span>
            </p>
            {notes.length > 0 && (
              <div className="mt-8 border-t border-line-soft pt-6">
                <h3 className="text-sm font-semibold text-t1">Le retour du correcteur</h3>
                <ul className="mt-4 space-y-5">
                  {notes.map((evaluation) => (
                    <li key={evaluation.criterionId}>
                      <p className="text-sm font-medium text-t2">{evaluation.label}</p>
                      <p className="mt-1 max-w-prose whitespace-pre-line text-sm leading-relaxed text-t3">{evaluation.feedback}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 id="result-heading" className="font-display text-2xl font-bold text-t1">Réponse envoyée.</h2>
            <p className="mt-2 max-w-prose text-t3">Elle sera notée bientôt. En attendant, la solution et les autres réponses sont ouvertes.</p>
          </>
        )}
        <ShareButton variant="primary" className="mt-6 sm:w-fit" title={challenge.title} path={resultPath(submission.id)} label={graded ? 'Partager mon score' : 'Partager le défi'}
          text={graded ? `J’ai obtenu ${submission.technicalScore} pts sur « ${challenge.title} » sur CrackLab. À toi :` : `Je viens de relever le défi « ${challenge.title} » sur CrackLab. À toi :`} />
      </section>
      <NextUp current={challenge.slug} />
    </div>
  );
}

/** Keyed by slug: moving to another challenge starts clean, with that challenge's own draft. */
export default function ChallengeRoute() {
  const { slug = '' } = useParams();
  return <ChallengePage key={slug} slug={slug} />;
}

function ChallengePage({ slug }: { slug: string }) {
  const { pathname } = useLocation();
  const { isLoading, isSignedIn, isAdmin } = useSession();
  const { reload: reloadProgress } = useCrackLabProgress();
  const challenge = useApi((signal) => api.cracklab.challenge(slug, signal), [slug, isSignedIn]);
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [answer, setAnswer] = useState(() => readDraft(slug));
  const [preview, setPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [tab, setTab] = useState<Tab>('resultat');
  const [answers, setAnswers] = useState<ChallengeSubmission[] | null>(null);
  const [answersError, setAnswersError] = useState('');
  const answerRef = useRef<HTMLElement>(null);
  const [answerInView, setAnswerInView] = useState(false);

  useEffect(() => { if (challenge.data) setDetail(challenge.data); }, [challenge.data]);
  useEffect(() => { writeDraft(slug, answer); }, [slug, answer]);

  const mine = detail?.mySubmission;
  useEffect(() => {
    if (!mine || tab !== 'reponses' || answers) return;
    const controller = new AbortController();
    api.cracklab.answers(slug, controller.signal)
      .then(setAnswers)
      .catch((error) => { if (!controller.signal.aborted) setAnswersError(error instanceof ApiError ? error.message : 'Impossible de charger les réponses.'); });
    return () => controller.abort();
  }, [mine, tab, answers, slug]);

  // On a phone the answer box sits below a long statement: a button stays in reach until it is on screen.
  useEffect(() => {
    const node = answerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setAnswerInView(entry.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [detail, mine]);

  const words = wordCount(answer);
  const over = Boolean(detail?.maxWords && words > detail.maxWords);

  async function submit() {
    if (!detail) return;
    setBusy(true);
    setFailure('');
    try {
      const submission = await api.cracklab.submit(detail.slug, answer);
      writeDraft(detail.slug, '');
      setAnswer('');
      setConfirming(false);
      setTab('resultat');
      setDetail({ ...detail, mySubmission: submission, submissionCount: detail.submissionCount + 1 });
      challenge.reload();
      reloadProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’envoi a échoué. Ta réponse est conservée, réessaie.');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (challenge.error) {
    return (
      <CrackLabLayout>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <ErrorState title={challenge.error.status === 404 ? 'Ce défi est introuvable.' : 'Impossible de charger ce défi.'} message={challenge.error.status === 404 ? 'Il n’est peut-être plus publié.' : challenge.error.message} onRetry={challenge.error.status === 404 ? undefined : challenge.reload} />
          <Link to="/cracklab" className="link mt-6 inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les défis</Link>
        </div>
      </CrackLabLayout>
    );
  }

  if (!detail) {
    return <CrackLabLayout><p role="status" className="px-5 py-24 text-center text-t3">Chargement du défi…</p></CrackLabLayout>;
  }

  const limit = detail.expectedFormat ?? (detail.maxWords ? `${detail.maxWords} mots maximum` : null);

  const statement = (
    <div className="space-y-8">
      <Prose text={detail.problem} />
      {detail.constraints && (
        <section aria-labelledby="constraints-heading" className="rounded-lg border border-line bg-noir-900 p-5 sm:p-6">
          <h2 id="constraints-heading" className="mb-3 text-sm font-semibold text-t1">Contraintes</h2>
          <Prose text={detail.constraints} compact />
        </section>
      )}
    </div>
  );

  const editor = isLoading ? null : !isSignedIn ? (
    <div className="rounded-lg border border-line bg-noir-900 p-6">
      <p className="font-semibold text-t1">Connecte-toi pour répondre.</p>
      <p className="mt-1 text-sm text-t3">Ton compte LesCracks suffit. La solution et les autres réponses s’ouvrent une fois ta réponse envoyée.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/connexion" state={{ from: pathname }} className="btn-primary">Se connecter</Link>
        <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer un compte</Link>
      </div>
    </div>
  ) : isAdmin ? (
    <p className="rounded-lg border border-line bg-noir-900 p-6 text-sm text-t3">Les défis se jouent avec un compte membre. Ton compte administrateur sert à les écrire et à noter les réponses.</p>
  ) : (
    <div className="flex flex-col">
      {preview
        ? <div className="min-h-80 rounded border border-line bg-noir-900 p-5 lg:h-[calc(100vh-17rem)] lg:overflow-y-auto">{answer.trim() ? <Prose text={answer} compact /> : <p className="text-sm text-t4">Rien à prévisualiser.</p>}</div>
        : <>
          <label htmlFor="answer" className="sr-only">Ta réponse</label>
          <textarea id="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={14} spellCheck lang="fr"
            placeholder="Ce que tu comprends du problème, ta solution, et pourquoi tu la choisis…"
            className="input h-auto min-h-80 resize-y py-4 text-base leading-relaxed lg:h-[calc(100vh-17rem)] lg:resize-none" aria-describedby="answer-count" />
        </>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p id="answer-count" aria-live="polite" className={`font-mono text-sm tabular-nums ${over ? 'text-error-ink' : 'text-t4'}`}>
          {words}{detail.maxWords ? ` / ${detail.maxWords}` : ''} mots{over ? ' : trop long' : ''}
        </p>
        <button type="button" onClick={() => setPreview((value) => !value)} aria-pressed={preview} className="ml-auto inline-flex h-11 items-center gap-1.5 rounded px-3 text-sm text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
          {preview ? <PenLine className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}{preview ? 'Écrire' : 'Aperçu'}
        </button>
        <button type="button" disabled={!answer.trim() || over || busy} onClick={() => setConfirming(true)} className="btn-primary"><Send className="h-4 w-4" aria-hidden />Envoyer</button>
      </div>
      {failure && <p role="alert" className="mt-4 rounded border border-error/30 bg-error/10 p-3 text-sm text-t1">{failure}</p>}
      <p className="mt-3 text-xs text-t4">Markdown accepté. Ton brouillon reste sur cet appareil jusqu’à l’envoi.</p>
    </div>
  );

  const tabs: [Tab, string][] = [['resultat', 'Mon résultat'], ['solution', 'Solution'], ['reponses', 'Autres réponses'], ['enonce', 'Énoncé']];

  return (
    <CrackLabLayout>
      <SEO title={`${detail.title} · CrackLab`} description={`Défi ${detail.category} : ${detail.problem.replace(/[#*`>\-[\]()]/g, '').slice(0, 150)}`} url={challengePath(detail.slug)} />

      <header className="border-b border-line-soft">
        <div className="mx-auto max-w-6xl px-5 pb-8 pt-4 sm:px-8 sm:pb-10">
          <Link to="/cracklab" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-t3 transition-colors duration-150 hover:text-t1"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les défis</Link>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-t4"><Difficulty value={detail.difficulty} /><span>{detail.category}</span></p>
          <h1 className="mt-3 max-w-3xl text-balance font-display text-3xl font-bold leading-[1.05] tracking-tight text-t1 sm:text-5xl">{detail.title}</h1>
        </div>
      </header>

      {mine ? (
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <div role="tablist" aria-label="Après ta réponse" className="-mx-5 mb-8 flex gap-1 overflow-x-auto border-b border-line-soft px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {tabs.map(([value, name]) => (
              <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
                className={`-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors ${tab === value ? 'border-gold-400 text-t1' : 'border-transparent text-t3 hover:text-t1'}`}>
                {name}
              </button>
            ))}
          </div>
          {tab === 'resultat' && (
            <div className="space-y-8">
              <Result submission={mine} challenge={detail} />
              <section aria-labelledby="my-answer-heading">
                <h2 id="my-answer-heading" className={`${label} mb-3`}>Ta réponse</h2>
                <div className="rounded-lg border border-line bg-noir-900 p-5 sm:p-6"><Prose text={mine.answer} compact /></div>
              </section>
            </div>
          )}
          {tab === 'solution' && (
            <section aria-label="Solution">
              <p className="mb-6 text-sm text-t4">Une solution possible parmi d’autres.</p>
              {detail.referenceSolution && <Prose text={detail.referenceSolution} />}
            </section>
          )}
          {tab === 'reponses' && (
            answersError ? <ErrorState title={answersError} onRetry={() => { setAnswersError(''); setAnswers(null); }} />
              : !answers ? <p role="status" className="text-sm text-t3">Chargement des réponses…</p>
                : <ul className="space-y-4">{answers.map((submission) => (
                  <AnswerCard key={submission.id} submission={submission} onVoted={(voteScore, myVote) =>
                    setAnswers((list) => list?.map((item) => (item.id === submission.id ? { ...item, voteScore, myVote } : item)) ?? null)} />
                ))}</ul>
          )}
          {tab === 'enonce' && statement}
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-12">
          <section aria-label="Énoncé" className="min-w-0">{statement}</section>
          <section ref={answerRef} id="reponse" aria-labelledby="answer-heading" className="min-w-0 scroll-mt-20 border-t border-line-soft pt-8 lg:sticky lg:top-20 lg:self-start lg:border-t-0 lg:pt-0">
            <div className="mb-4">
              <h2 id="answer-heading" className="font-display text-2xl font-bold tracking-tight text-t1">Ta réponse</h2>
              {limit && <p className="mt-1 text-sm text-t4">{limit}</p>}
            </div>
            {editor}
          </section>
        </div>
      )}

      {!mine && !answerInView && (
        <a href="#reponse" className="btn-primary fixed inset-x-5 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 justify-center shadow-lg lg:hidden">
          <PenLine className="h-4 w-4" aria-hidden />Répondre
        </a>
      )}

      <Dialog open={confirming} onOpenChange={(open) => { if (!busy) setConfirming(open); }}>
        <DialogContent className="mode-raised border-line bg-card sm:max-w-md">
          <DialogTitle className="font-display text-2xl font-bold text-t1">Envoyer ta réponse ?</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-t3">
            Tu ne pourras plus la modifier. La solution et les autres réponses s’ouvriront juste après.
          </DialogDescription>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="btn-secondary">Relire encore</button>
            <button type="button" disabled={busy} onClick={() => void submit()} className="btn-primary">{busy ? 'Envoi…' : 'Envoyer'}</button>
          </div>
        </DialogContent>
      </Dialog>
    </CrackLabLayout>
  );
}
