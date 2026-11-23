import { deriveEventStatus } from '@/lib/eventStatus';
import type { MyEvent } from '@/services/types';

export interface MyAgenda {
  live: MyEvent[];
  /** Soonest first. */
  coming: MyEvent[];
  /** Most recent first. */
  past: MyEvent[];
}

/** A member's registrations by tense, with the same rule that opens and closes an event everywhere else. */
export function splitMyEvents(events: MyEvent[]): MyAgenda {
  const agenda: MyAgenda = { live: [], coming: [], past: [] };
  for (const event of events) {
    const status = deriveEventStatus(event.startDate, event.endDate);
    if (status === 'open') agenda.live.push(event);
    else if (status === 'upcoming') agenda.coming.push(event);
    else agenda.past.push(event);
  }
  // The API sends the newest start first, which is the right order for the past only.
  agenda.coming.reverse();
  return agenda;
}

/** The registration that matters most right now: one happening, else the next one. */
export const nextOfMine = (agenda: MyAgenda): MyEvent | undefined => agenda.live[0] ?? agenda.coming[0];
