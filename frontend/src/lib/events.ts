import { FORMAT_LABEL } from '@/components/events/AgendaItem';
import { deriveEventStatus } from '@/lib/eventStatus';
import type { EventSummary } from '@/services/types';

/** Happening right now: between its start and its end (or the end of its day). */
export const isLive = (event: Pick<EventSummary, 'startDate' | 'endDate'>) => deriveEventStatus(event.startDate, event.endDate) === 'open';

/** « En ligne », or the format with the city when people come in person: « Sur place, Yaoundé ». */
export function eventPlace(event: Pick<EventSummary, 'format' | 'location'>): string {
  const format = FORMAT_LABEL[event.format];
  return event.format !== 'ONLINE' && event.location ? `${format}, ${event.location}` : format;
}

/** « 34 inscrits », or nothing while nobody has signed up: a zero only discourages. */
export function attendanceLabel(count: number): string | null {
  if (count <= 0) return null;
  return `${count} inscrit${count > 1 ? 's' : ''}`;
}

/** LesCracks no longer runs hackathons; past ones can still come back from the API. */
export const withoutHackathons = (events: EventSummary[]) => events.filter((event) => event.type !== 'HACKATHON');
