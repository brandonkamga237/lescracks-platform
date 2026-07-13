// src/lib/applicationPipeline.ts
//
// The single definition of the candidate funnel. Everything (filters, funnel bars,
// stage buttons, colours) derives from this list, so a stage can never exist in one
// place and be missing in another.
//
// The old model was pending / accepted / rejected — a three-faced boolean. It could
// say how many people said yes, but never WHERE the others were lost.

export type ApplicationStage =
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'INTERVIEW'
  | 'ACCEPTED'
  | 'STARTED'
  | 'COMPLETED'
  | 'REJECTED';

export interface StageMeta {
  key: ApplicationStage;
  label: string;
  /** Short description of what this stage actually means, so the team stays consistent. */
  hint: string;
  /** Semantic colour — deliberately NOT the gold accent, which is for actions. */
  dot: string;
  chip: string;
}

/**
 * The happy path, in order. REJECTED is intentionally excluded: it is an exit, not a
 * step, and putting it in the funnel would make the drop-off maths lie.
 */
export const FUNNEL: StageMeta[] = [
  {
    key: 'RECEIVED',
    label: 'Reçue',
    hint: 'Elle est arrivée. Personne ne l\'a encore lue.',
    dot: 'bg-sky-400',
    chip: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  },
  {
    key: 'UNDER_REVIEW',
    label: 'En revue',
    hint: 'Quelqu\'un l\'étudie.',
    dot: 'bg-indigo-400',
    chip: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
  },
  {
    key: 'INTERVIEW',
    label: 'Entretien',
    hint: 'Entretien planifié ou passé.',
    dot: 'bg-violet-400',
    chip: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  },
  {
    key: 'ACCEPTED',
    label: 'Acceptée',
    hint: 'Une place lui est proposée.',
    dot: 'bg-amber-400',
    chip: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  },
  {
    key: 'STARTED',
    label: 'Démarrée',
    hint: 'Accepté ET réellement commencé — ce n\'est pas la même chose.',
    dot: 'bg-emerald-400',
    chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  },
  {
    key: 'COMPLETED',
    label: 'Terminée',
    hint: 'Accompagnement mené à son terme.',
    dot: 'bg-teal-400',
    chip: 'bg-teal-500/10 text-teal-300 border-teal-500/25',
  },
];

export const REJECTED: StageMeta = {
  key: 'REJECTED',
  label: 'Refusée',
  hint: 'Écartée, à n\'importe quelle étape.',
  dot: 'bg-rose-400',
  chip: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
};

export const ALL_STAGES: StageMeta[] = [...FUNNEL, REJECTED];

export const stageMeta = (key: string): StageMeta =>
  ALL_STAGES.find((s) => s.key === key) ?? REJECTED;

/** The next step forward, or null at the end of the funnel. */
export const nextStage = (key: string): StageMeta | null => {
  const i = FUNNEL.findIndex((s) => s.key === key);
  if (i === -1 || i === FUNNEL.length - 1) return null;
  return FUNNEL[i + 1];
};

/** Still live in the funnel — not yet accepted, not yet rejected. */
export const isOpen = (key: string) =>
  key === 'RECEIVED' || key === 'UNDER_REVIEW' || key === 'INTERVIEW';
