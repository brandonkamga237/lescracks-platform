const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

const WEEK_MS = 6 * 24 * 60 * 60 * 1000;

export const eventDay = (iso: string) => dayFormat.format(new Date(iso));
export const eventMonth = (iso: string) => monthFormat.format(new Date(iso));

/** French clock time as people say it: « 19 h », « 19 h 30 ». */
export function eventHour(iso: string): string {
  const date = new Date(iso);
  const minutes = date.getMinutes();
  return `${date.getHours()} h${minutes ? ` ${String(minutes).padStart(2, '0')}` : ''}`;
}

/** « Jeudi 19 h » within the coming week, « 28 nov., 19 h » further out. */
export function eventTeaser(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (date.getTime() - now.getTime() < WEEK_MS) {
    const weekday = weekdayFormat.format(date);
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${eventHour(iso)}`;
  }
  return `${dateFormat.format(date)}, ${eventHour(iso)}`;
}
