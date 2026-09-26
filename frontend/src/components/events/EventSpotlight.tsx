import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { eventPath } from '@/lib/slugs';
import { FORMAT_LABEL, TYPE_LABEL } from '@/components/events/AgendaItem';
import type { EventSummary } from '@/services/types';

const monthYearFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' });

interface EventSpotlightProps {
  event: EventSummary;
  cataloguePath: string;
}

/**
 * The next rendez-vous, announced like the headline of an issue:
 * a monumental date rail facing the editorial block.
 */
function EventSpotlight({ event, cataloguePath }: EventSpotlightProps) {
  const start = new Date(event.startDate);
  const hasDate = !Number.isNaN(start.getTime());
  const meta = [TYPE_LABEL[event.type], FORMAT_LABEL[event.format], event.location]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <article className="grid gap-8 border-b border-line-soft/50 pb-12 sm:pb-16 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
      <div aria-hidden className="lg:border-r lg:border-line-soft/50 lg:pr-12">
        {hasDate ? (
          <>
            <span className="block font-display text-7xl font-medium leading-[0.95] text-t1 sm:text-8xl lg:text-9xl">
              {start.getDate()}
            </span>
            <span className="mt-3 block font-mono text-xs uppercase tracking-[0.2em] text-gold-400">
              {monthYearFormat.format(start)}
            </span>
            <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-t4">
              {weekdayFormat.format(start)}  ·  {timeFormat.format(start)}
            </span>
          </>
        ) : (
          <span className="block font-display text-6xl text-t4">—</span>
        )}
      </div>

      <div className="min-w-0 self-end">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="kicker">Prochain rendez-vous</span>
          <span className="kicker-muted">{meta}</span>
        </p>
        <h3 className="mt-5 max-w-3xl break-words font-display text-3xl font-medium leading-[1.1] tracking-tight text-t1 sm:text-5xl">
          <Link
            to={eventPath(event)}
            state={{ cataloguePath }}
            className="transition-colors hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {event.title}
          </Link>
        </h3>
        <p className="mt-5 line-clamp-3 max-w-2xl text-base leading-relaxed text-t3">
          {event.description}
        </p>
        <Link
          to={eventPath(event)}
          state={{ cataloguePath }}
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
        >
          Voir le rendez-vous
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export default memo(EventSpotlight);
