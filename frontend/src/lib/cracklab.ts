import type { ChallengeDifficulty } from '@/services/types';

export const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
};

/** Suggestions only: the category is free text, these keep the vocabulary consistent. */
export const CATEGORY_SUGGESTIONS = ['Backend', 'Frontend', 'DevOps', 'Database', 'Architecture', 'Sécurité', 'Data', 'Mobile', 'Cloud'];

/** Same rule as the backend's WordCount: runs of non-space characters. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export const challengePath = (slug: string) => `/cracklab/challenges/${slug}`;
