import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { FORMAT_LABEL, TYPE_LABEL } from '@/components/events/AgendaItem';
import { Reveal, RevealWords, StaggerItem, StaggerList } from '@/components/motion/Reveal';
import { Panel } from '@/components/motion/Parallax';
import { eventDay, eventHour, eventMonth } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

function where(event: EventSummary): string {
  const format = FORMAT_LABEL[event.format];
  return event.format !== 'ONLINE' && event.location ? `${format}, ${event.location}` : format;
}

function attendance(count: number): string | null {
  if (count <= 0) return null;
  return `${count} inscrit${count > 1 ? 's' : ''}`;
}

/** The next rendez-vous as a list, laid over the ivory band. */
export default function UpcomingEvents({ events }: { events: EventSummary[] }) {
  return (
    <Panel id="rendez-vous" labelledBy="events-title" className="relative z-20 -mt-8 rounded-t-[2rem] bg-black sm:rounded-t-[3rem]">
      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-20 sm:px-8 sm:pt-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal><p className="text-sm font-medium text-gold-400">Agenda</p></Reveal>
            <RevealWords
              id="events-title"
              parts={['Prochains rendez-vous.', { text: 'Ateliers, webinaires et conférences.', className: 'text-white/40' }]}
              className="mt-5 max-w-2xl text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]"
            />
          </div>
          <Reveal>
            <Link to="/evenements" className="group inline-flex shrink-0 items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
              Tout l’agenda <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <StaggerList className="mt-14 border-t border-white/10">
          {events.map((event) => {
            const count = attendance(event.registrationCount);
            return (
              <StaggerItem key={event.id}>
                <Link to={eventPath(event)} className="group relative isolate grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 py-6 sm:grid-cols-[7rem_minmax(0,1fr)_14rem_auto] sm:gap-8">
                  <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white/[0.03] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                  <time dateTime={event.startDate} className="pl-2 leading-none">
                    <span className="block text-4xl font-semibold tracking-tight text-gold-400 sm:text-5xl">{eventDay(event.startDate)}</span>
                    <span className="mt-1.5 block text-xs text-white/50">{eventMonth(event.startDate)} · {eventHour(event.startDate)}</span>
                  </time>
                  <span className="min-w-0">
                    <span className="block text-lg font-medium tracking-tight transition-[color,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-2 group-hover:text-gold-400 sm:text-2xl">{event.title}</span>
                    <span className="mt-1 block text-sm text-white/50 sm:hidden">{TYPE_LABEL[event.type]} · {where(event)}</span>
                  </span>
                  <span className="hidden text-sm text-white/50 sm:block">
                    {TYPE_LABEL[event.type]} · {where(event)}
                    {count && <><br />{count}</>}
                  </span>
                  <span className="mr-2 grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-[background-color,border-color,color,transform] duration-300 group-hover:-rotate-45 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-black">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </div>
    </Panel>
  );
}
