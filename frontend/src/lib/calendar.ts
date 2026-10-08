import type { EventSummary } from '@/services/types';

/** Events without an end date are booked for two hours, the length of a typical workshop. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function bounds(event: Pick<EventSummary, 'startDate' | 'endDate'>) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return { start, end: Number.isNaN(end.getTime()) ? new Date(start.getTime() + DEFAULT_DURATION_MS) : end };
}

/** RFC 5545 text: commas, semicolons and backslashes escaped, newlines as \n. */
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function googleCalendarUrl(event: EventSummary, url: string): string {
  const { start, end } = bounds(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `${event.description}\n\n${url}`,
    ...(event.location ? { location: event.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Downloads an .ics file: Apple Calendar, Outlook and most Android calendars open it. */
export function downloadIcs(event: EventSummary, url: string) {
  const { start, end } = bounds(event);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LesCracks//Agenda//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@lescracks.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(`${event.description}\n\n${url}`)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.slug || `evenement-${event.id}`}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
