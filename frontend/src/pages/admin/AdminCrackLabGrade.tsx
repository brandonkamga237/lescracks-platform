import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';

import { AdminSection } from '@/components/admin/AdminTable';
import Prose from '@/components/cracklab/Prose';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminChallenge, ChallengeSubmission } from '@/services/types';

interface GradeDraft { points: string; feedback: string; }

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/** One answer graded against the rubric, with the reference solution at hand but never as an answer key. */
export default function AdminCrackLabGrade() {
  const { id } = useParams();
  const submissionId = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<ChallengeSubmission | null>(null);
  const [challenge, setChallenge] = useState<AdminChallenge | null>(null);
  const [grades, setGrades] = useState<Record<number, GradeDraft>>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nextId, setNextId] = useState<number | null>(null);

  useEffect(() => {
    if (!submissionId) { setFailure('Cette réponse est introuvable.'); return; }
    const controller = new AbortController();
    setSaved(false);
    setNextId(null);
    adminApi.cracklab.submission(submissionId, controller.signal)
      .then(async (loaded) => {
        setSubmission(loaded);
        const rubric = await adminApi.cracklab.challenge(loaded.challengeId, controller.signal);
        setChallenge(rubric);
        const given = new Map(loaded.evaluations.map((evaluation) => [evaluation.criterionId, evaluation]));
        setGrades(Object.fromEntries(rubric.criteria.map((criterion) => [criterion.id, {
          points: given.has(criterion.id) ? String(given.get(criterion.id)!.points) : '',
          feedback: given.get(criterion.id)?.feedback ?? '',
        }])));
      })
      .catch((error) => { if (!controller.signal.aborted) setFailure(error instanceof ApiError ? error.message : 'Impossible de charger la réponse.'); });
    return () => controller.abort();
  }, [submissionId]);

  const total = challenge?.criteria.reduce((sum, criterion) => sum + (Number(grades[criterion.id]?.points) || 0), 0) ?? 0;
  const setGrade = (criterionId: number, patch: Partial<GradeDraft>) =>
    setGrades((value) => ({ ...value, [criterionId]: { ...value[criterionId], ...patch } }));

  async function save() {
    if (!submission || !challenge) return;
    const invalid = challenge.criteria.find((criterion) => {
      const points = grades[criterion.id]?.points;
      return points === '' || points === undefined || Number(points) < 0 || Number(points) > criterion.maxPoints;
    });
    if (invalid) { setFailure(`Note « ${invalid.label} » entre 0 et ${invalid.maxPoints}.`); return; }
    setBusy(true);
    setFailure('');
    try {
      const graded = await adminApi.cracklab.grade(submission.id, challenge.criteria.map((criterion) => ({
        criterionId: criterion.id,
        points: Number(grades[criterion.id].points),
        feedback: grades[criterion.id].feedback.trim() || undefined,
      })));
      setSubmission(graded);
      setSaved(true);
      const queue = await adminApi.cracklab.submissions({ status: 'SUBMITTED' });
      setNextId(queue.content.find((item) => item.id !== graded.id)?.id ?? null);
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'La notation a échoué. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  const back = <Link to="/admin/cracklab/reponses" className="btn-secondary"><ArrowLeft className="h-4 w-4" aria-hidden />File d’attente</Link>;
  if (!submission || !challenge) {
    return <AdminSection title="Noter une réponse" action={back}>
      {failure ? <p role="alert" className="rounded border border-error/30 bg-error/10 p-4 text-sm text-t1">{failure}</p> : <p role="status" className="rounded-lg border border-line-soft bg-card px-5 py-10 text-center text-sm text-t3">Chargement…</p>}
    </AdminSection>;
  }

  return (
    <AdminSection title="Noter une réponse" description={challenge.title} action={back}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div className="space-y-6">
          <section aria-labelledby="answer-heading" className="rounded-lg border border-line-soft bg-card p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-soft pb-4">
              <h2 id="answer-heading" className="font-display text-lg font-bold text-t1">La réponse de {submission.author.displayName}</h2>
              <p className="text-xs text-t4">{dateFormat.format(new Date(submission.createdAt))} · {submission.wordCount} mots{challenge.maxWords ? ` / ${challenge.maxWords}` : ''}</p>
            </div>
            <div className="mt-6"><Prose text={submission.answer} compact /></div>
          </section>
          <details className="group rounded-lg border border-line-soft bg-card p-5 sm:p-7">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold text-t1">
              Solution de référence
              <ChevronDown className="h-4 w-4 text-t4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 text-xs text-t4">Une solution correcte parmi d’autres : la réponse se juge sur la grille, pas sur sa ressemblance.</p>
            <div className="mt-5"><Prose text={challenge.referenceSolution} /></div>
          </details>
          <details className="group rounded-lg border border-line-soft bg-card p-5 sm:p-7">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold text-t1">
              Énoncé
              <ChevronDown className="h-4 w-4 text-t4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-5"><Prose text={challenge.problem} /></div>
          </details>
        </div>

        <section aria-labelledby="grade-heading" className="rounded-lg border border-line-soft bg-card p-5 sm:p-6 xl:sticky xl:top-24">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="grade-heading" className="font-display text-lg font-bold text-t1">Notation</h2>
            <p className="font-display text-2xl font-bold tabular-nums text-gold-ink">{total}<span className="text-base text-t4"> / {challenge.totalPoints}</span></p>
          </div>
          <ol className="mt-5 space-y-5">
            {challenge.criteria.map((criterion) => (
              <li key={criterion.id}>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`grade-${criterion.id}`} className="text-sm font-medium text-t1">{criterion.label}</label>
                  <span className="flex items-center gap-1.5 text-sm text-t4">
                    <input id={`grade-${criterion.id}`} type="number" inputMode="numeric" min={0} max={criterion.maxPoints} value={grades[criterion.id]?.points ?? ''}
                      onChange={(event) => setGrade(criterion.id, { points: event.target.value })} className="input h-10 w-16 px-2 text-center text-base" />
                    / {criterion.maxPoints}
                  </span>
                </div>
                <textarea aria-label={`Commentaire sur « ${criterion.label} »`} rows={2} value={grades[criterion.id]?.feedback ?? ''}
                  onChange={(event) => setGrade(criterion.id, { feedback: event.target.value })} placeholder="Ce qui est réussi, ce qui manque…" className="input mt-2 h-auto py-2.5 text-sm" />
              </li>
            ))}
          </ol>
          {failure && <p role="alert" className="mt-4 rounded border border-error/30 bg-error/10 p-3 text-sm text-t1">{failure}</p>}
          {saved && <p role="status" className="mt-4 text-sm text-gold-ink">Note enregistrée : le membre voit maintenant son score et tes commentaires.</p>}
          <div className="mt-5 grid gap-2">
            <button type="button" disabled={busy} onClick={() => void save()} className="btn-primary">{busy ? 'Enregistrement…' : submission.status === 'GRADED' && !saved ? 'Mettre à jour la note' : 'Enregistrer la note'}</button>
            {saved && (nextId
              ? <button type="button" onClick={() => navigate(`/admin/cracklab/reponses/${nextId}`)} className="btn-secondary">Réponse suivante</button>
              : <p className="text-center text-xs text-t4">Plus aucune réponse en attente.</p>)}
          </div>
        </section>
      </div>
    </AdminSection>
  );
}
