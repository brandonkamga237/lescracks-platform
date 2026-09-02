import type { ResourceSummary } from '@/services/types';

/**
 * How much of an evening a resource costs.
 *
 * The catalogue is organised around this rather than around subject, because that is the
 * question a beginner actually asks. "Je veux du DevOps" comes later, and only once someone
 * knows enough to want it; "j'ai vingt minutes ce soir" is true from the first day.
 */

export type EffortBand = 'quick' | 'session' | 'deep';

export interface EffortBandDefinition {
  id: EffortBand;
  label: string;
  /** Said the way a person thinks about their evening, not as a range of integers. */
  hint: string;
  matches: (resource: ResourceSummary) => boolean;
}

/** Pages read at roughly this rate, which is what turns an ebook into a comparable cost. */
const MINUTES_PER_PAGE = 2;

/** Minutes a resource costs, whichever unit it was measured in. Null when unrecorded. */
export function effortMinutes(resource: ResourceSummary): number | null {
  if (resource.minutes != null) return resource.minutes;
  if (resource.pages != null) return resource.pages * MINUTES_PER_PAGE;
  return null;
}

export const EFFORT_BANDS: EffortBandDefinition[] = [
  {
    id: 'quick',
    label: 'Moins de 15 min',
    hint: 'Une pause',
    matches: (r) => within(r, 0, 15),
  },
  {
    id: 'session',
    label: '15 min à 1 h',
    hint: 'Une soirée',
    matches: (r) => within(r, 15, 60),
  },
  {
    id: 'deep',
    label: 'Plus d’une heure',
    hint: 'Un week-end',
    matches: (r) => within(r, 60, Infinity),
  },
];

function within(resource: ResourceSummary, min: number, max: number): boolean {
  const minutes = effortMinutes(resource);
  // Unrecorded means unknown, and a filter must not quietly hide what it cannot measure.
  if (minutes == null) return false;
  return minutes >= min && minutes < max;
}

/**
 * What the card shows. An ebook says pages because that is how a reader sizes a book; a
 * video and an article say minutes because that is how anyone sizes those.
 */
export function effortLabel(resource: ResourceSummary): string | null {
  if (resource.pages != null) {
    return `${resource.pages} page${resource.pages > 1 ? 's' : ''}`;
  }
  if (resource.minutes != null) {
    if (resource.minutes < 60) return `${resource.minutes} min`;
    const hours = Math.floor(resource.minutes / 60);
    const rest = resource.minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
  }
  return null;
}

export const KIND_LABEL: Record<ResourceSummary['kind'], string> = {
  VIDEO: 'Vidéo',
  EBOOK: 'Ebook',
  ARTICLE: 'Article',
};
