import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Lock, PenLine, Plus, X } from 'lucide-react';

import { AdminSection } from '@/components/admin/AdminTable';
import Prose from '@/components/cracklab/Prose';
import { CATEGORY_SUGGESTIONS, DIFFICULTY_LABEL } from '@/lib/cracklab';
import { adminApi, type ChallengeRequest } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminChallenge, ChallengeDifficulty, ChallengeStatus } from '@/services/types';

interface CriterionDraft { key: string; id?: number; label: string; maxPoints: string; }

interface Draft {
  title: string;
  category: string;
  difficulty: ChallengeDifficulty;
  tags: string[];
  problem: string;
  constraints: string;
  expectedFormat: string;
  maxWords: string;
  referenceSolution: string;
  criteria: CriterionDraft[];
}

let keySeed = 0;
const key = () => `c${keySeed++}`;

/** The brief's example rubric: a sensible starting point the admin edits rather than a blank list. */
const STARTER_CRITERIA: CriterionDraft[] = [
  { key: key(), label: 'Identification du problème', maxPoints: '20' },
  { key: key(), label: 'Solution proposée', maxPoints: '30' },
  { key: key(), label: 'Justification', maxPoints: '20' },
  { key: key(), label: 'Scalabilité', maxPoints: '15' },
  { key: key(), label: 'Compromis (trade-offs)', maxPoints: '15' },
];

const EMPTY: Draft = {
  title: '', category: '', difficulty: 'INTERMEDIATE', tags: [], problem: '', constraints: '',
  expectedFormat: '500 mots maximum', maxWords: '500', referenceSolution: '', criteria: STARTER_CRITERIA,
};

function fromChallenge(challenge: AdminChallenge): Draft {
  return {
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    tags: challenge.tags,
    problem: challenge.problem,
    constraints: challenge.constraints ?? '',
    expectedFormat: challenge.expectedFormat ?? '',
    maxWords: challenge.maxWords ? String(challenge.maxWords) : '',
    referenceSolution: challenge.referenceSolution,
    criteria: challenge.criteria.map((criterion) => ({ key: key(), id: criterion.id, label: criterion.label, maxPoints: String(criterion.maxPoints) })),
  };
}

interface MarkdownFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}

/** A Markdown textarea with a preview toggle rendered exactly like the public page. */
function MarkdownField({ id, label, hint, value, rows, onChange }: MarkdownFieldProps) {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-t1">{label}<span className="mt-0.5 block text-xs font-normal text-t4">{hint}</span></label>
        <button type="button" onClick={() => setPreview((value) => !value)} aria-pressed={preview} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded px-2.5 text-xs text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
          {preview ? <PenLine className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}{preview ? 'Écrire' : 'Aperçu'}
        </button>
      </div>
      {preview
        ? <div className="mt-2 min-h-24 rounded border border-line bg-noir-900 p-5">{value.trim() ? <Prose text={value} /> : <p className="text-sm text-t4">Rien à prévisualiser.</p>}</div>
        : <textarea id={id} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="input mt-2 h-auto py-3 font-mono text-[0.875rem] leading-relaxed" />}
    </div>
  );
}

export default function AdminCrackLabEditor() {
  const { id } = useParams();
  const challengeId = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<AdminChallenge | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(Boolean(challengeId));
  const [busy, setBusy] = useState<ChallengeStatus | null>(null);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!challengeId) return;
    const controller = new AbortController();
    adminApi.cracklab.challenge(challengeId, controller.signal)
      .then((loaded) => { setChallenge(loaded); setDraft(fromChallenge(loaded)); })
      .catch((error) => { if (!controller.signal.aborted) setFailure(error instanceof ApiError ? error.message : 'Impossible de charger le challenge.'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [challengeId]);

  const locked = Boolean(challenge?.gradingLocked);
  const total = draft.criteria.reduce((sum, criterion) => sum + (Number(criterion.maxPoints) || 0), 0);
  const update = (patch: Partial<Draft>) => setDraft((value) => ({ ...value, ...patch }));
  const updateCriterion = (index: number, patch: Partial<CriterionDraft>) =>
    update({ criteria: draft.criteria.map((criterion, i) => (i === index ? { ...criterion, ...patch } : criterion)) });
  const moveCriterion = (index: number, offset: number) => {
    const next = [...draft.criteria];
    const [moved] = next.splice(index, 1);
    next.splice(index + offset, 0, moved);
    update({ criteria: next });
  };

  function addTags(raw: string) {
    const fresh = raw.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (!fresh.length) return;
    update({ tags: Array.from(new Set([...draft.tags, ...fresh])) });
    setTagInput('');
  }

  async function save(status: ChallengeStatus) {
    setFailure('');
    setNotice('');
    const missing = [!draft.title.trim() && 'le titre', !draft.category.trim() && 'la catégorie', !draft.problem.trim() && 'l’énoncé',
      !draft.referenceSolution.trim() && 'la solution de référence'].filter(Boolean);
    if (missing.length) { setFailure(`Complète ${missing.join(', ')}.`); return; }
    if (!draft.criteria.length || draft.criteria.some((criterion) => !criterion.label.trim() || !(Number(criterion.maxPoints) > 0))) {
      setFailure('Chaque critère a besoin d’un libellé et d’un nombre de points supérieur à 0.');
      return;
    }
    const body: ChallengeRequest = {
      title: draft.title.trim(),
      category: draft.category.trim(),
      difficulty: draft.difficulty,
      tags: draft.tags,
      problem: draft.problem,
      constraints: draft.constraints || undefined,
      expectedFormat: draft.expectedFormat || undefined,
      maxWords: draft.maxWords ? Number(draft.maxWords) : undefined,
      referenceSolution: draft.referenceSolution,
      criteria: draft.criteria.map((criterion) => ({ id: criterion.id, label: criterion.label.trim(), maxPoints: Number(criterion.maxPoints) })),
      status,
    };
    setBusy(status);
    try {
      const saved = challengeId ? await adminApi.cracklab.update(challengeId, body) : await adminApi.cracklab.create(body);
      setChallenge(saved);
      setDraft(fromChallenge(saved));
      setNotice(status === 'PUBLISHED' ? 'Le challenge est publié.' : status === 'ARCHIVED' ? 'Le challenge est archivé.' : 'Brouillon enregistré.');
      if (!challengeId) navigate(`/admin/cracklab/challenges/${saved.id}`, { replace: true });
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’enregistrement a échoué. Réessaie.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p role="status" className="rounded-lg border border-line-soft bg-card px-5 py-10 text-center text-sm text-t3">Chargement…</p>;

  const status = challenge?.status ?? 'DRAFT';
  const sectionTitle = 'font-display text-lg font-bold text-t1';

  return (
    <AdminSection
      title={challengeId ? 'Modifier le challenge' : 'Nouveau challenge'}
      description="Un énoncé clair, une solution de référence, une grille de notation. Tout s’écrit en Markdown."
      action={<Link to="/admin/cracklab/challenges" className="btn-secondary"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les challenges</Link>}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="space-y-6">
          <section className="space-y-5 rounded-lg border border-line-soft bg-card p-5 sm:p-6" aria-labelledby="cl-info">
            <h2 id="cl-info" className={sectionTitle}>Informations</h2>
            <label className="block text-sm font-medium text-t1">Titre
              <input value={draft.title} maxLength={200} onChange={(event) => update({ title: event.target.value })} placeholder="Ex. Une API qui ralentit sous la charge" className="input mt-2" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-t1">Catégorie
                <input list="cracklab-categories" value={draft.category} maxLength={80} onChange={(event) => update({ category: event.target.value })} placeholder="Backend, DevOps…" className="input mt-2" />
                <datalist id="cracklab-categories">{CATEGORY_SUGGESTIONS.map((category) => <option key={category} value={category} />)}</datalist>
              </label>
              <label className="block text-sm font-medium text-t1">Difficulté
                <select value={draft.difficulty} onChange={(event) => update({ difficulty: event.target.value as ChallengeDifficulty })} className="input mt-2">
                  {(Object.keys(DIFFICULTY_LABEL) as ChallengeDifficulty[]).map((difficulty) => <option key={difficulty} value={difficulty}>{DIFFICULTY_LABEL[difficulty]}</option>)}
                </select>
              </label>
            </div>
            <div>
              <label htmlFor="cl-tags" className="text-sm font-medium text-t1">Tags<span className="mt-0.5 block text-xs font-normal text-t4">Entrée ou virgule pour ajouter : Java, Spring Boot, PostgreSQL…</span></label>
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-line p-2">
                {draft.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded bg-noir-800 py-1 pl-2.5 pr-1 text-xs text-t1">{tag}
                    <button type="button" onClick={() => update({ tags: draft.tags.filter((item) => item !== tag) })} aria-label={`Retirer ${tag}`} className="flex h-6 w-6 items-center justify-center rounded text-t4 hover:text-t1"><X className="h-3 w-3" aria-hidden /></button>
                  </span>
                ))}
                <input id="cl-tags" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onBlur={() => addTags(tagInput)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTags(tagInput); } }}
                  className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-t1 placeholder:text-t4 focus:outline-none" placeholder={draft.tags.length ? '' : 'Ajouter un tag'} />
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-lg border border-line-soft bg-card p-5 sm:p-6" aria-labelledby="cl-problem">
            <h2 id="cl-problem" className={sectionTitle}>Énoncé</h2>
            <MarkdownField id="cl-problem-text" label="Le problème et son contexte" hint="Ce que les membres lisent en premier. Markdown : ## titres, listes, ```code```." rows={12} value={draft.problem} onChange={(problem) => update({ problem })} />
            <MarkdownField id="cl-constraints" label="Contraintes" hint="Facultatif : budget, stack imposée, volumétrie…" rows={5} value={draft.constraints} onChange={(constraints) => update({ constraints })} />
            <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
              <label className="block text-sm font-medium text-t1">Format attendu
                <input value={draft.expectedFormat} maxLength={300} onChange={(event) => update({ expectedFormat: event.target.value })} placeholder="Ex. 500 mots maximum, schéma bienvenu" className="input mt-2" />
              </label>
              <label className="block text-sm font-medium text-t1">Limite de mots
                <input type="number" min={1} value={draft.maxWords} onChange={(event) => update({ maxWords: event.target.value })} placeholder="Aucune" className="input mt-2" />
              </label>
            </div>
          </section>

          <section className="space-y-5 rounded-lg border border-line-soft bg-card p-5 sm:p-6" aria-labelledby="cl-solution">
            <h2 id="cl-solution" className={sectionTitle}>Solution de référence</h2>
            <MarkdownField id="cl-solution-text" label="Une solution correcte, parmi d’autres possibles" hint="Visible uniquement par les membres qui ont soumis leur réponse." rows={10} value={draft.referenceSolution} onChange={(referenceSolution) => update({ referenceSolution })} />
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <section className="rounded-lg border border-line-soft bg-card p-5 sm:p-6" aria-labelledby="cl-rubric">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="cl-rubric" className={sectionTitle}>Grille de notation</h2>
              <p className={`text-sm font-semibold tabular-nums ${total === 100 ? 'text-gold-ink' : 'text-t2'}`}>{total} pts</p>
            </div>
            {locked && <p className="mt-3 flex gap-2 rounded border border-line bg-noir-900 p-3 text-xs leading-relaxed text-t3"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-ink" aria-hidden />Des réponses sont déjà notées : les points et la liste des critères sont figés. Seuls les libellés restent modifiables.</p>}
            <ol className="mt-4 space-y-3">
              {draft.criteria.map((criterion, index) => (
                <li key={criterion.key} className="rounded border border-line p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 w-5 shrink-0 text-xs tabular-nums text-t4">{index + 1}.</span>
                    <input aria-label={`Libellé du critère ${index + 1}`} value={criterion.label} maxLength={200} onChange={(event) => updateCriterion(index, { label: event.target.value })} className="input h-10 min-w-0 flex-1 text-sm" />
                    <input aria-label={`Points du critère ${index + 1}`} type="number" min={1} disabled={locked} value={criterion.maxPoints} onChange={(event) => updateCriterion(index, { maxPoints: event.target.value })} className="input h-10 w-16 shrink-0 px-2 text-center text-sm disabled:opacity-60" />
                  </div>
                  {!locked && (
                    <div className="mt-2 flex justify-end gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveCriterion(index, -1)} aria-label="Monter" className="flex h-8 w-8 items-center justify-center rounded text-t4 hover:bg-noir-800 hover:text-t1 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" aria-hidden /></button>
                      <button type="button" disabled={index === draft.criteria.length - 1} onClick={() => moveCriterion(index, 1)} aria-label="Descendre" className="flex h-8 w-8 items-center justify-center rounded text-t4 hover:bg-noir-800 hover:text-t1 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" aria-hidden /></button>
                      <button type="button" disabled={draft.criteria.length === 1} onClick={() => update({ criteria: draft.criteria.filter((_, i) => i !== index) })} aria-label="Retirer le critère" className="flex h-8 w-8 items-center justify-center rounded text-t4 hover:bg-noir-800 hover:text-error-ink disabled:opacity-30"><X className="h-3.5 w-3.5" aria-hidden /></button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {!locked && <button type="button" onClick={() => update({ criteria: [...draft.criteria, { key: key(), label: '', maxPoints: '10' }] })} className="btn-secondary mt-3 w-full"><Plus className="h-4 w-4" aria-hidden />Ajouter un critère</button>}
            {total !== 100 && <p className="mt-3 text-xs text-t4">Un total de 100 points se lit plus facilement, sans être obligatoire.</p>}
          </section>

          <section className="rounded-lg border border-line-soft bg-card p-5 sm:p-6" aria-labelledby="cl-publish">
            <h2 id="cl-publish" className={sectionTitle}>Publication</h2>
            <p className="mt-2 text-sm text-t3">{status === 'PUBLISHED' ? 'Publié : visible par tout le monde, ouvert aux réponses.' : status === 'ARCHIVED' ? 'Archivé : caché du public, les réponses sont conservées.' : 'Brouillon : visible uniquement dans l’administration.'}</p>
            {failure && <p role="alert" className="mt-4 rounded border border-error/30 bg-error/10 p-3 text-sm text-t1">{failure}</p>}
            {notice && <p role="status" className="mt-4 text-sm text-gold-ink">{notice}</p>}
            <div className="mt-5 grid gap-2">
              <button type="button" disabled={!!busy} onClick={() => void save('PUBLISHED')} className="btn-primary">{busy === 'PUBLISHED' ? 'Publication…' : status === 'PUBLISHED' ? 'Enregistrer' : 'Publier'}</button>
              {status !== 'PUBLISHED' && <button type="button" disabled={!!busy} onClick={() => void save('DRAFT')} className="btn-secondary">{busy === 'DRAFT' ? 'Enregistrement…' : 'Enregistrer le brouillon'}</button>}
              {status === 'PUBLISHED' && <button type="button" disabled={!!busy} onClick={() => void save('ARCHIVED')} className="btn-secondary text-t3">{busy === 'ARCHIVED' ? 'Archivage…' : 'Archiver'}</button>}
            </div>
          </section>
        </div>
      </div>
    </AdminSection>
  );
}
