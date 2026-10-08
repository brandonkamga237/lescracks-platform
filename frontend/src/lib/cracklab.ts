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
export const memberPath = (id: number) => `/cracklab/membres/${id}`;
export const resultPath = (id: number) => `/cracklab/resultats/${id}`;
export const rankingPath = (period: 'all' | 'week' = 'all') => (period === 'week' ? '/cracklab/classement?periode=semaine' : '/cracklab/classement');

export const percentOf = (score: number | undefined, total: number) => (total && score != null ? Math.round((score / total) * 100) : 0);

/** French ordinal for a rank: 1er, 2e, 3e… */
export const ordinal = (rank: number) => `${rank}${rank === 1 ? 'er' : 'e'}`;

export const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

/** The weekly board resets on Monday 00:00 UTC, same rule as the backend's Streaks. */
export function weekResetsIn(now = new Date()): string {
  const day = (now.getUTCDay() + 6) % 7;
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7 - day);
  const hours = Math.max(0, Math.floor((next - now.getTime()) / 3_600_000));
  return hours >= 24 ? `${Math.floor(hours / 24)} j ${hours % 24} h` : `${hours} h`;
}

// Literal classes so Tailwind generates them: a bar filled in 5 % steps, no inline style.
const FILL = ['w-0', 'w-[5%]', 'w-[10%]', 'w-[15%]', 'w-[20%]', 'w-[25%]', 'w-[30%]', 'w-[35%]', 'w-[40%]', 'w-[45%]', 'w-[50%]',
  'w-[55%]', 'w-[60%]', 'w-[65%]', 'w-[70%]', 'w-[75%]', 'w-[80%]', 'w-[85%]', 'w-[90%]', 'w-[95%]', 'w-full'];
export const fillClass = (ratio: number) => FILL[Math.round(Math.min(1, Math.max(0, ratio)) * 20)];
