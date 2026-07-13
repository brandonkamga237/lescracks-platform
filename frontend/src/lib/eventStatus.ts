// src/lib/eventStatus.ts
//
// The single rule for what state an event is in. It MUST match Event.deriveStatus()
// on the backend, or the admin preview would promise one thing and the API return
// another.
//
// A hand-picked status is correct the day you set it and wrong the morning after.
// Deriving it means events open and close on their own, with nothing to maintain.

export type EventStatus = 'upcoming' | 'open' | 'closed';

/**
 * @param start  event start (required — an event always has one)
 * @param end    optional end. Without it, the event runs until the end of the start DAY:
 *               a one-day event is over when the day is over, not the instant it began.
 */
export const deriveEventStatus = (start?: string | null, end?: string | null): EventStatus => {
  if (!start) return 'upcoming';

  const now = new Date();
  const startAt = new Date(start);
  if (Number.isNaN(startAt.getTime())) return 'upcoming';

  if (now < startAt) return 'upcoming';

  let closesAt: Date;
  if (end) {
    closesAt = new Date(end);
    if (Number.isNaN(closesAt.getTime())) closesAt = endOfDay(startAt);
  } else {
    closesAt = endOfDay(startAt);
  }

  return now > closesAt ? 'closed' : 'open';
};

const endOfDay = (d: Date) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};
