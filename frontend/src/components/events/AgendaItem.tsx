import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Mic, Rocket, Video, Wrench } from 'lucide-react';

import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

export const TYPE_LABEL = { BOOTCAMP: 'Bootcamp', WORKSHOP: 'Atelier', WEBINAR: 'Webinaire', CONFERENCE: 'Conférence' } as const;
export const FORMAT_LABEL = { ONLINE: 'En ligne', OFFLINE: 'Sur place', HYBRID: 'Hybride' } as const;
export const TYPE_ICON = { BOOTCAMP: Rocket, WORKSHOP: Wrench, WEBINAR: Video, CONFERENCE: Mic } as const;

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });

interface AgendaItemProps {
  event: EventSummary;
  cataloguePath: string;
}

/**
 * One line of the agenda: an oversized date column, then the title and its
 * practical details. Reads like the calendar page of a magazine.
 */
function AgendaItem({ event, cataloguePath }: AgendaItemProps) {
  const start = new Date(event.startDate);
  const hasDate = !Number.isNaN(start.getTime());
  const meta = [TYPE_LABEL[event.type], FORMAT_LABEL[event.format], event.location]
    .filter(Boolean)
    .join('  ·  ');
  const TypeIcon = TYPE_ICON[event.type];

  return (
    <li>
      <Link
        to={eventPath(event)}
        state={{ cataloguePath }}
        className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-x-4 border-t border-line-soft/50 px-1 py-5 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-x-8"
      >
        <span aria-hidden className="pt-0.5">
          {hasDate ? (
            <>
              <span className="block font-display text-3xl font-medium leading-none text-t1 sm:text-4xl">
                {start.getDate()}
              </span>
              <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-gold-400">
                {weekdayFormat.format(start)} {monthFormat.format(start)}
              </span>
            </>
          ) : (
            <span className="block font-display text-3xl leading-none text-t4">·</span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block break-words font-display text-xl font-medium leading-snug text-t1 transition-colors group-hover:text-gold-300 sm:text-2xl">
            {event.title}
          </span>
          <span className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-t4">
            <TypeIcon className="h-3.5 w-3.5 shrink-0 text-gold-400/70" aria-hidden />
            {meta}
          </span>
        </span>
        <ArrowUpRight className="mt-1 h-5 w-5 text-t4 opacity-0 transition-opacity group-hover:text-gold-300 group-hover:opacity-100" aria-hidden />
      </Link>
    </li>
  );
}

export default memo(AgendaItem);
