import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Clock3, Crown, Eye, Lock, PenLine, Send, Users } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import Badges from '@/components/cracklab/Badges';
import CountUp from '@/components/cracklab/CountUp';
import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import Difficulty from '@/components/cracklab/Difficulty';
import LevelChip from '@/components/cracklab/LevelChip';
import Prose from '@/components/cracklab/Prose';
import XpBar from '@/components/cracklab/XpBar';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import { ErrorState } from '@/components/common/States';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useApi } from '@/hooks/useApi';
import { useCrackLabProgress } from '@/hooks/useCrackLabProgress';
import { useSession } from '@/hooks/useSession';
import { challengePath, fillClass, memberPath, ordinal, percentOf, plural, resultPath, wordCount } from '@/lib/cracklab';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { ChallengeDetail, ChallengeSubmission } from '@/services/types';

type Tab = 'resultat' | 'solution' | 'reponses' | 'enonce';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

// The draft lives in this browser only: losing a long answer to a closed tab is the worst outcome here.
const draftKey = (slug: string) => `lescracks.cracklab.draft.${slug}`;
function readDraft(slug: string) { try { return localStorage.getItem(draftKey(slug)) ?? ''; } catch { return ''; } }
function writeDraft(slug: string, text: string) { try { if (text) localStorage.setItem(draftKey(slug), text); else localStorage.removeItem(draftKey(slug)); } catch { /* storage blocked */ } }

function Score({ submission }: { submission: ChallengeSubmission }) {
  if (submission.status !== 'GRADED') {
    return <span className="inline-flex items-center gap-1.5 text-sm text-t3"><Clock3 className="h-4 w-4" aria-hidden />En attente de notation</span>;
  }
  return <span className="font-mono text-lg font-bold tabular-nums text-gold-ink">{submission.technicalScore}<span className="text-sm font-normal text-t4"> / {submission.totalPoints}</span></span>;
}

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

function AnswerCard({ submission, onVoted }: { submission: ChallengeSubmission; onVoted: (voteScore: number, myVote: -1 | 0 | 1) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`flex gap-3 rounded-lg border p-4 sm:gap-5 sm:p-5 ${submission.mine ? 'border-gold-400/30 bg-gold-400/[0.04]' : 'border-line bg-noir-900'}`}>
      <Votes submission={submission} onVoted={onVoted} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link to={memberPath(submission.author.id)} className="flex items-center gap-2 text-sm font-semibold text-t1 hover:text-gold-ink"><Avatar member={submission.author} size="sm" />{submission.author.displayName}{submission.mine && <span className="rounded bg-gold-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-gold-ink">toi</span>}</Link>
          <Score submission={submission} />
        </div>
        <p className="mt-0.5 text-xs text-t4">{dateFormat.format(new Date(submission.createdAt))} · {submission.wordCount} mots</p>
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
    <Link to={challengePath(next.slug)} className="group flex items-center gap-4 rounded-lg border border-line bg-noir-900 p-4 transition-colors hover:border-gold-400/40 sm:p-5">
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">Challenge suivant</span>
        <span className="mt-1 block truncate font-display text-lg font-bold text-t1 group-hover:text-gold-ink">{next.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-t4"><Difficulty value={next.difficulty} />{next.submissionCount ? plural(next.submissionCount, 'participant') : 'Aucune réponse encore'}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-gold-ink transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function Result({ submission, challenge }: { submission: ChallengeSubmission; challenge: ChallengeDetail }) {
  const { progress } = useCrackLabProgress();
  const graded = submission.status === 'GRADED';
  const standing = useApi((signal) => (graded ? api.cracklab.result(submission.id, signal) : Promise.resolve(null)), [submission.id, graded]);
  const share = (
    <ShareButton variant="primary" className="sm:w-auto" title={challenge.title} path={resultPath(submission.id)} label={graded ? 'Partager mon score' : 'Partager mon défi'}
      text={graded ? `J’ai obtenu ${submission.technicalScore}/${submission.totalPoints} sur « ${challenge.title} » sur CrackLab. Tu ferais mieux ?` : `Je viens de relever le challenge « ${challenge.title} » sur CrackLab. À toi :`} />
  );

  if (!graded) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gold-400/30 bg-gold-400/[0.06] p-6 sm:p-8 motion-safe:animate-pop">
          <p className="flex items-center gap-2 font-display text-2xl font-bold text-t1"><Clock3 className="h-6 w-6 text-gold-ink" aria-hidden />Réponse enregistrée</p>
          <p className="mt-2 text-sm leading-relaxed text-t3">Elle est notée à la main, critère par critère : chaque point obtenu deviendra de l’XP et comptera au classement. En attendant, découvre la solution de référence et les autres réponses.</p>
          {progress && <XpBar xp={progress.xp} level={progress.level} nextLevel={progress.nextLevel} className="mt-6 max-w-md" />}
          <div className="mt-6">{share}</div>
        </div>
        <NextUp current={challenge.slug} />
      </div>
    );
  }
  const percent = percentOf(submission.technicalScore, submission.totalPoints);
  const rank = standing.data;
  const crowd = challenge.gradedCount;
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border border-gold-400/40 bg-noir-900 p-6 shadow-gold sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative">
          <p className="label">Ton score</p>
          <p className="mt-3 flex items-baseline gap-2 font-display font-bold leading-none text-t1">
            <CountUp value={submission.technicalScore ?? 0} className="text-7xl sm:text-8xl" />
            <span className="text-3xl text-t4">/ {submission.totalPoints}</span>
            <span className="ml-auto rounded bg-gold-400 px-2 py-1 font-mono text-sm font-bold text-black motion-safe:animate-pop motion-safe:[animation-delay:700ms]">+{submission.technicalScore} XP</span>
          </p>
          <div aria-hidden className="mt-5 h-2.5 overflow-hidden rounded-full bg-noir-700">
            <div className={`h-full origin-left rounded-full bg-gradient-to-r from-gold-500 to-gold-300 motion-safe:animate-grow-x ${fillClass(percent / 100)}`} />
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
            {rank?.rankOnChallenge === 1 ? <span className="inline-flex items-center gap-1.5 font-semibold text-gold-ink"><Crown className="h-5 w-5" aria-hidden />Meilleur score du challenge</span>
              : rank && crowd > 1 ? <span className="font-semibold text-t1">Mieux que {rank.betterThanPercent} % des participants</span>
                : <span className="text-t3">{percent} % des points</span>}
            {rank && crowd > 1 && <span className="font-mono text-sm text-t4">{ordinal(rank.rankOnChallenge)} sur {crowd}{challenge.averageScore != null ? ` · moyenne ${challenge.averageScore}` : ''}</span>}
          </p>
          {progress && (
            <div className="mt-6 border-t border-line-soft pt-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <LevelChip level={progress.level} />
                <Badges badges={progress.badges} compact />
              </div>
              <XpBar xp={progress.xp} level={progress.level} nextLevel={progress.nextLevel} />
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            {share}
            <Link to="/cracklab/classement" className="btn-secondary">Voir le classement</Link>
          </div>
        </div>
      </div>
      <NextUp current={challenge.slug} />
      <h2 className="label pt-2">Détail par critère</h2>
      <ol className="space-y-3">
        {submission.evaluations.map((evaluation) => (
          <li key={evaluation.criterionId} className="rounded-lg border border-line bg-noir-900 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-t1">{evaluation.label}</p>
              <p className="font-mono text-sm tabular-nums text-t2">{evaluation.points} / {evaluation.maxPoints}</p>
            </div>
            <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-noir-700">
              <div className={`h-full rounded-full bg-gold-400 ${fillClass(evaluation.points / evaluation.maxPoints)}`} />
            </div>
            {evaluation.feedback && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-t3">{evaluation.feedback}</p>}
          </li>
        ))}
      </ol>
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
          <ErrorState title={challenge.error.status === 404 ? 'Ce challenge est introuvable.' : 'Impossible de charger ce challenge.'} message={challenge.error.status === 404 ? 'Il n’est peut-être plus publié.' : challenge.error.message} onRetry={challenge.error.status === 404 ? undefined : challenge.reload} />
          <Link to="/cracklab" className="link mt-6 inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les challenges</Link>
        </div>
      </CrackLabLayout>
    );
  }

  if (!detail) {
    return <CrackLabLayout><p role="status" className="px-5 py-24 text-center text-t3">Chargement du challenge…</p></CrackLabLayout>;
  }

  const tabs: [Tab, string][] = mine ? [['resultat', 'Mon résultat'], ['solution', 'Solution de référence'], ['reponses', `Réponses (${detail.submissionCount})`], ['enonce', 'Énoncé']] : [];

  const statement = (
    <div className="space-y-10">
      <section aria-labelledby="problem-heading">
        <h2 id="problem-heading" className="label mb-4">Énoncé</h2>
        <Prose text={detail.problem} />
      </section>
      {detail.constraints && (
        <section aria-labelledby="constraints-heading" className="rounded-lg border border-line bg-noir-900 p-5 sm:p-6">
          <h2 id="constraints-heading" className="label mb-3">Contraintes</h2>
          <Prose text={detail.constraints} compact />
        </section>
      )}
    </div>
  );

  return (
    <CrackLabLayout>
      <SEO title={`${detail.title} · CrackLab`} description={`Challenge ${detail.category} : ${detail.problem.replace(/[#*`>\-[\]()]/g, '').slice(0, 150)}`} url={challengePath(detail.slug)} />

      <header className="border-b border-line-soft bg-noir-900/40">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8 sm:pb-12">
          <Link to="/cracklab" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-t3 transition-colors hover:text-t1"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les challenges</Link>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Difficulty value={detail.difficulty} />
            <span className="label">{detail.category}</span>
            {detail.tags.map((tag) => <Link key={tag} to={`/cracklab?tag=${encodeURIComponent(tag)}`} className="rounded bg-noir-800 px-2 py-0.5 font-mono text-[11px] text-t3 transition-colors hover:text-t1">{tag}</Link>)}
          </div>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-4xl font-bold leading-[1] tracking-tight text-t1 sm:text-5xl lg:text-6xl">{detail.title}</h1>
          <p className="mt-5 font-mono text-sm text-t4">{detail.totalPoints} points · {detail.expectedFormat ?? (detail.maxWords ? `${detail.maxWords} mots maximum` : 'format libre')}</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <dl className="flex gap-6 sm:gap-8">
              <div><dt className="text-[11px] uppercase tracking-[0.08em] text-t4">Participants</dt><dd className="mt-1 flex items-center gap-1.5 font-mono text-2xl font-bold tabular-nums text-t1"><Users className="h-4 w-4 text-t4" aria-hidden />{detail.submissionCount}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.08em] text-t4">Moyenne</dt><dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-t1">{detail.averageScore ?? '—'}<span className="text-sm font-normal text-t4">/{detail.totalPoints}</span></dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.08em] text-t4">Record</dt><dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-gold-ink">{detail.bestScore ?? '—'}<span className="text-sm font-normal text-t4">/{detail.totalPoints}</span></dd></div>
            </dl>
            <ShareButton className="sm:w-auto" title={detail.title} path={challengePath(detail.slug)} label="Défier un ami"
              text={`Challenge CrackLab : « ${detail.title} ». ${detail.bestScore != null ? `Le record est à ${detail.bestScore}/${detail.totalPoints}.` : 'Personne n’a encore de note.'} Tu relèves le défi ?`} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <div className="min-w-0">
          {mine ? (
            <>
              <div role="tablist" aria-label="Après ta réponse" className="-mx-5 mb-8 flex gap-1 overflow-x-auto border-b border-line-soft px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
                {tabs.map(([value, label]) => (
                  <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
                    className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors ${tab === value ? 'border-gold-400 text-t1' : 'border-transparent text-t3 hover:text-t1'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {tab === 'resultat' && (
                <div className="space-y-8">
                  <Result submission={mine} challenge={detail} />
                  <section aria-labelledby="my-answer-heading">
                    <h2 id="my-answer-heading" className="label mb-4">Ta réponse · {mine.wordCount} mots</h2>
                    <div className="rounded-lg border border-line bg-noir-900 p-5 sm:p-6"><Prose text={mine.answer} compact /></div>
                  </section>
                </div>
              )}
              {tab === 'solution' && (
                <section aria-label="Solution de référence">
                  <p className="mb-6 rounded border border-line bg-noir-900 p-4 text-sm leading-relaxed text-t3">Une solution correcte parmi d’autres. Ta réponse n’est pas comparée mot pour mot : elle est notée sur la grille.</p>
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
            </>
          ) : (
            <>
              {statement}
              <section aria-labelledby="answer-heading" className="mt-12 border-t border-line-soft pt-10">
                <h2 id="answer-heading" className="font-display text-2xl font-bold tracking-tight text-t1 sm:text-3xl">Ta réponse</h2>
                {isLoading ? null : !isSignedIn ? (
                  <div className="mt-5 rounded-lg border border-line bg-noir-900 p-6">
                    <p className="font-semibold text-t1">Connecte-toi pour répondre.</p>
                    <p className="mt-1 text-sm text-t3">Ton compte LesCracks suffit. La solution de référence et les autres réponses s’ouvrent une fois ta réponse envoyée.</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link to="/connexion" state={{ from: pathname }} className="btn-primary">Se connecter</Link>
                      <Link to="/inscription" state={{ from: pathname }} className="btn-secondary">Créer un compte</Link>
                    </div>
                  </div>
                ) : isAdmin ? (
                  <p className="mt-5 rounded-lg border border-line bg-noir-900 p-6 text-sm text-t3">Les challenges se jouent avec un compte membre. Ton compte administrateur sert à les écrire et à noter les réponses.</p>
                ) : (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-t4">Markdown accepté : ## titres, listes, ```code```.</p>
                      <button type="button" onClick={() => setPreview((value) => !value)} aria-pressed={preview} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded px-2.5 text-xs text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
                        {preview ? <PenLine className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}{preview ? 'Écrire' : 'Aperçu'}
                      </button>
                    </div>
                    {preview
                      ? <div className="mt-2 min-h-64 rounded border border-line bg-noir-900 p-5">{answer.trim() ? <Prose text={answer} /> : <p className="text-sm text-t4">Rien à prévisualiser.</p>}</div>
                      : <>
                        <label htmlFor="answer" className="sr-only">Ta réponse</label>
                        <textarea id="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={16} spellCheck lang="fr"
                          placeholder="Explique le problème, ta solution et pourquoi tu la choisis plutôt qu’une autre…"
                          className="input mt-2 h-auto py-4 text-base leading-relaxed" aria-describedby="answer-count" />
                      </>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p id="answer-count" aria-live="polite" className={`font-mono text-sm tabular-nums ${over ? 'text-error-ink' : 'text-t4'}`}>
                        {words}{detail.maxWords ? ` / ${detail.maxWords}` : ''} mots{over ? ' : trop long' : ''}
                      </p>
                      <button type="button" disabled={!answer.trim() || over || busy} onClick={() => setConfirming(true)} className="btn-primary"><Send className="h-4 w-4" aria-hidden />Envoyer ma réponse</button>
                    </div>
                    {failure && <p role="alert" className="mt-4 rounded border border-error/30 bg-error/10 p-3 text-sm text-t1">{failure}</p>}
                    <p className="mt-3 text-xs text-t4">Ton brouillon est gardé sur cet appareil jusqu’à l’envoi.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Grille de notation">
          {mine && (
            <div className="rounded-lg border border-line bg-noir-900 p-5">
              <p className="label">Ta réponse</p>
              <div className="mt-2"><Score submission={mine} /></div>
            </div>
          )}
          <div className="rounded-lg border border-line bg-noir-900 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-t1">Grille de notation</h2>
              <span className="font-mono text-sm text-gold-ink">{detail.totalPoints} pts</span>
            </div>
            <ol className="mt-4 space-y-2.5">
              {detail.criteria.map((criterion) => (
                <li key={criterion.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-t2">{criterion.label}</span>
                  <span className="font-mono tabular-nums text-t4">{criterion.maxPoints}</span>
                </li>
              ))}
            </ol>
            {!mine && <p className="mt-5 flex gap-2 border-t border-line-soft pt-4 text-xs leading-relaxed text-t4"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Solution de référence et autres réponses visibles après l’envoi de la tienne.</p>}
          </div>
        </aside>
      </div>

      <Dialog open={confirming} onOpenChange={(open) => { if (!busy) setConfirming(open); }}>
        <DialogContent className="mode-raised border-line bg-card sm:max-w-md">
          <DialogTitle className="font-display text-2xl font-bold text-t1">Envoyer ta réponse ?</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-t3">
            Elle sera définitive : la solution de référence et les autres réponses s’ouvriront juste après. {words} mots{detail.maxWords ? ` sur ${detail.maxWords}` : ''}.
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
