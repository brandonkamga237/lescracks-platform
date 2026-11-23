import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { Button } from '@/components/ui/button';
import { PulseDot } from '@/components/ui/pulse-dot';
import { attendanceLabel, eventPlace, isLive } from '@/lib/events';
import { eventDay, eventHour, eventMonth } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

/** The next rendez-vous, given the room of a headline above the rest of the agenda. */
export default function EventFeature({ event }: { event: EventSummary }) {
  const live = isLive(event);
  const count = attendanceLabel(event.registrationCount);
  return (
    <Link to={eventPath(event)} className="group relative isolate grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] transition-colors hover:border-gold-400/40 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gold-400/20 to-white/[0.02] md:aspect-auto">
        {event.coverImage && <img src={event.coverImage} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
      </div>
      <div className="flex flex-col justify-between gap-10 p-6 sm:p-10">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gold-400">{live && <PulseDot />}{live ? 'En direct' : 'Prochain rendez-vous'}</p>
          <p className="mt-5 text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] transition-colors group-hover:text-gold-400">{event.title}</p>
          <p className="mt-4 text-sm text-white/55">{TYPE_LABEL[event.type]} · {eventPlace(event)}{count && ` · ${count}`}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <time dateTime={event.startDate} className="leading-none">
            <span className="block text-6xl font-semibold tracking-tight text-gold-400">{eventDay(event.startDate)}</span>
            <span className="mt-2 block text-sm text-white/55">{eventMonth(event.startDate)} · {eventHour(event.startDate)}</span>
          </time>
          <Button asChild size="lg" className="font-semibold"><span>{live ? 'Rejoindre' : 'Voir et s’inscrire'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Button>
        </div>
      </div>
    </Link>
  );
}
