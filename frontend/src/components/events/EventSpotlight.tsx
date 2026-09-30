import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { eventPath } from '@/lib/slugs';
import { FORMAT_LABEL, TYPE_ICON, TYPE_LABEL } from '@/components/events/AgendaItem';
import type { EventSummary } from '@/services/types';

const monthYearFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' });

interface EventSpotlightProps {
  event: EventSummary;
  /** Gold label above the title, e.g. "Prochain rendez-vous". */
  kicker?: string;
  cataloguePath: string;
}

/**
 * The next rendez-vous, announced like the headline of an issue:
 * a monumental date rail facing the editorial block.
 */
function EventSpotlight({ event, kicker = 'Prochain rendez-vous', cataloguePath }: EventSpotlightProps) {
  const start = new Date(event.startDate);
  const hasDate = !Number.isNaN(start.getTime());
  const meta = [TYPE_LABEL[event.type], FORMAT_LABEL[event.format], event.location]
    .filter(Boolean)
    .join('  ·  ');
  const TypeIcon = TYPE_ICON[event.type];

  return (
    <article className="grid gap-8 border-b border-line pb-12 sm:pb-16 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
      <div aria-hidden className="lg:border-r lg:border-line lg:pr-10">
        {hasDate ? (
          <>
            <span className="block font-display text-7xl font-bold leading-[0.88] tracking-tight text-t1 lg:text-8xl">
              {start.getDate()}
            </span>
            <span className="mt-3 block kicker">
              {monthYearFormat.format(start)}
            </span>
            <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-t4">
              {weekdayFormat.format(start)}  ·  {timeFormat.format(start)}
            </span>
          </>
        ) : (
          <span className="block font-display text-4xl text-t4">Bientôt</span>
        )}
      </div>

      <div className="min-w-0 self-center">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="kicker">{kicker}</span>
          <span className="kicker-muted inline-flex items-center gap-2">
            <TypeIcon className="h-3.5 w-3.5 text-gold-ink" aria-hidden />
            {meta}
          </span>
        </p>
        <h3 className="mt-5 max-w-3xl break-words font-display text-4xl font-bold leading-[0.98] tracking-tight text-t1 sm:text-5xl xl:text-[3.25rem] xl:leading-[0.94]">
          <Link
            to={eventPath(event)}
            state={{ cataloguePath }}
            className="transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {event.title}
          </Link>
        </h3>
        <p className="mt-6 line-clamp-3 max-w-2xl text-base leading-normal text-t3">
          {event.description}
        </p>
        <Link
          to={eventPath(event)}
          state={{ cataloguePath }}
          className="btn-primary mt-8"
        >
          Voir le rendez-vous
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export default memo(EventSpotlight);
