import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { ListRow } from '@/components/ui/list-row';
import { attendanceLabel, eventPlace } from '@/lib/events';
import { eventDay, eventHour, eventMonth } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

/** An event as one line of an agenda: the day in large gold figures, then what and where. */
export default function EventRow({ event }: { event: EventSummary }) {
  const what = `${TYPE_LABEL[event.type]} · ${eventPlace(event)}`;
  const count = attendanceLabel(event.registrationCount);
  return (
    <ListRow
      to={eventPath(event)}
      columns="grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:grid-cols-[7rem_minmax(0,1fr)_14rem_auto]"
      leading={(
        <time dateTime={event.startDate} className="pl-2 leading-none">
          <span className="block text-4xl font-semibold tracking-tight text-gold-400 sm:text-5xl">{eventDay(event.startDate)}</span>
          <span className="mt-1.5 block text-xs text-white/50">{eventMonth(event.startDate)} · {eventHour(event.startDate)}</span>
        </time>
      )}
      title={event.title}
      subtitle={what}
      meta={<>{what}{count && <><br />{count}</>}</>}
    />
  );
}
