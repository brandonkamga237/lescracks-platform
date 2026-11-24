import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock3, MapPin, Users, Video } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { PulseDot } from '@/components/ui/pulse-dot';
import { attendanceLabel, eventPlace, isLive } from '@/lib/events';
import { eventDay, eventHour, eventMonth } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import { cn } from '@/lib/utils';
import type { EventSummary } from '@/services/types';

interface EventCardProps {
  event: EventSummary;
  past?: boolean;
  /** The reader is signed up for it. */
  registered?: boolean;
}

/** A rendez-vous as a card: its cover with the date pinned on it, then what, when, where and how many. */
export default function EventCard({ event, past = false, registered = false }: EventCardProps) {
  const [broken, setBroken] = useState(false);
  const live = !past && isLive(event);
  const count = attendanceLabel(event.registrationCount);
  const Place = event.format === 'ONLINE' ? Video : MapPin;
  return (
    <Link to={eventPath(event)} className={cn('group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-gold-400/40', past && 'opacity-75 hover:opacity-100')}>
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gold-400/20 to-white/[0.02]">
        {event.coverImage && !broken
          ? <img src={event.coverImage} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className={cn('h-full w-full object-cover transition duration-700 group-hover:scale-105', past && 'grayscale')} />
          : <span aria-hidden="true" className="absolute bottom-3 right-4 text-2xl font-semibold tracking-tight text-white/15">{TYPE_LABEL[event.type]}</span>}
        <time dateTime={event.startDate} className="absolute left-3 top-3 grid min-w-14 place-items-center rounded-2xl bg-black/80 px-2.5 py-2 leading-none backdrop-blur">
          <span className={cn('text-2xl font-semibold tracking-tight', past ? 'text-white/60' : 'text-gold-400')}>{eventDay(event.startDate)}</span>
          <span className="mt-1 text-[11px] uppercase text-white/60">{eventMonth(event.startDate)}</span>
        </time>
        {live && <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-2.5 py-1 text-xs font-semibold text-black"><PulseDot className="[&>span]:bg-black" />En direct</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center justify-between gap-2 text-xs font-medium text-gold-400">
          {TYPE_LABEL[event.type]}
          {registered && <span className="inline-flex items-center gap-1 rounded-full border border-gold-400/40 px-2 py-0.5 text-gold-400"><Check className="h-3 w-3" aria-hidden="true" />{past ? 'Inscrit' : 'Tu participes'}</span>}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-gold-400">{event.title}</h3>
        <ul className="mt-auto space-y-1.5 pt-4 text-sm text-white/55">
          <li className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />{eventHour(event.startDate)}</li>
          <li className="flex items-center gap-2"><Place className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" /><span className="truncate">{eventPlace(event)}</span></li>
          {count && <li className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />{count}</li>}
        </ul>
      </div>
    </Link>
  );
}
