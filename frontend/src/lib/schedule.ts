// Scheduled publication: the admin picks a local date and time, the API stores an instant.

const pad = (value: number) => String(value).padStart(2, '0');

/** ISO instant → value of an <input type="datetime-local">, in the admin's own time zone. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The input's local value → ISO instant, or null when empty or unreadable. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const longFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const shortFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const formatScheduleLong = (iso: string) => longFormat.format(new Date(iso));
export const formatScheduleShort = (iso: string) => shortFormat.format(new Date(iso));

/** The earliest date the picker offers: a few minutes ahead, so it is still future when saved. */
export function minScheduleInput(): string {
  return toLocalInput(new Date(Date.now() + 5 * 60_000).toISOString());
}

function at(day: Date, hours: number): Date {
  const date = new Date(day);
  date.setHours(hours, 0, 0, 0);
  return date;
}

/** One-tap dates for preparing content ahead: tomorrow morning, next Monday, in a week. */
export function quickSchedules(now = new Date()): Array<[string, string]> {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const monday = new Date(now);
  monday.setDate(now.getDate() + (((8 - now.getDay()) % 7) || 7));
  const week = new Date(now);
  week.setDate(now.getDate() + 7);
  return [
    ['Demain 9 h', at(tomorrow, 9).toISOString()],
    ['Demain 18 h', at(tomorrow, 18).toISOString()],
    ['Lundi 9 h', at(monday, 9).toISOString()],
    ['Dans une semaine', at(week, 9).toISOString()],
  ];
}

/** True when the picked date can be sent: set, in the future, and before the limit if any. */
export function scheduleIsValid(value: string | null, before?: string): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time > Date.now() && (!before || time < new Date(before).getTime());
}
