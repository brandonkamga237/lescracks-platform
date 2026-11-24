import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { Button } from '@/components/ui/button';
import { PulseDot } from '@/components/ui/pulse-dot';
import { eventPlace } from '@/lib/events';
import { eventTeaser } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import type { EventSummary, MyEvent } from '@/services/types';

interface NextUpProps {
  /** The member's own next rendez-vous, or the one happening now. */
  mine?: MyEvent;
  live: boolean;
  /** How many more they are signed up for after it. */
  others: number;
  /** The platform's next rendez-vous, offered when they have none of their own. */
  suggestion?: EventSummary;
}

/** The one thing to do next, at the top of the dashboard: join, prepare, or sign up. */
export default function NextUp({ mine, live, others, suggestion }: NextUpProps) {
  if (!mine && !suggestion) return null;

  const event = mine ?? suggestion!;
  const label = mine ? (live ? 'C’est maintenant' : 'Ton prochain rendez-vous') : 'Prochain rendez-vous sur LesCracks';
  const action = mine ? (live ? 'Rejoindre' : 'Voir le rendez-vous') : 'Je m’inscris';

  return (
    <section aria-labelledby="next-up-title" className="flex flex-col gap-5 rounded-3xl border border-gold-400/25 bg-gold-400/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-400/15 text-gold-400"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-gold-400">{live && <PulseDot />}{label}</p>
          <h2 id="next-up-title" className="mt-1 text-lg font-semibold leading-snug tracking-tight sm:text-xl">{event.title}</h2>
          <p className="mt-1 text-sm text-white/55">
            {TYPE_LABEL[event.type]} · {live ? 'En direct' : eventTeaser(event.startDate)}
            {'format' in event && ` · ${eventPlace(event)}`}
            {mine && others > 0 && ` · et ${others} autre${others > 1 ? 's' : ''} ensuite`}
          </p>
        </div>
      </div>
      <Button asChild className="shrink-0 font-semibold">
        <Link to={eventPath(event)}>{action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
      </Button>
    </section>
  );
}
