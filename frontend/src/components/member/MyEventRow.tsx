import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { ListRow } from '@/components/ui/list-row';
import { PulseDot } from '@/components/ui/pulse-dot';
import { eventDay, eventHour, eventMonth } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import { cn } from '@/lib/utils';
import type { MyEvent, RegistrationStatus } from '@/services/types';

export type Tense = 'live' | 'coming' | 'past';

const PAST_STATUS: Partial<Record<RegistrationStatus, string>> = { ATTENDED: 'Présent', ABSENT: 'Absent' };

function stateOf(event: MyEvent, tense: Tense): string {
  if (tense === 'live') return 'En direct';
  if (tense === 'coming') return 'Inscrit';
  return PAST_STATUS[event.status] ?? 'Terminé';
}

/** One of the member's own rendez-vous as an agenda line: the day, what it is, and where they stand. */
export default function MyEventRow({ event, tense }: { event: MyEvent; tense: Tense }) {
  const state = stateOf(event, tense);
  const what = `${TYPE_LABEL[event.type]} · ${state}`;
  return (
    <ListRow
      to={eventPath(event)}
      dense
      columns="grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_12rem_auto]"
      leading={(
        <time dateTime={event.startDate} className="pl-2 leading-none">
          <span className={cn('block text-2xl font-semibold tracking-tight sm:text-3xl', tense === 'past' ? 'text-white/40' : 'text-gold-400')}>{eventDay(event.startDate)}</span>
          <span className="mt-1.5 block text-xs text-white/50">{eventMonth(event.startDate)} · {eventHour(event.startDate)}</span>
        </time>
      )}
      title={event.title}
      subtitle={what}
      meta={(
        <>
          {TYPE_LABEL[event.type]}
          <br />
          <span className={cn('inline-flex items-center gap-2', tense === 'live' && 'text-gold-400')}>{tense === 'live' && <PulseDot />}{state}</span>
        </>
      )}
    />
  );
}
