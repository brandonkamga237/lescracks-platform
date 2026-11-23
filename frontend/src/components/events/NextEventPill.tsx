import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { PulseDot } from '@/components/ui/pulse-dot';
import { isLive } from '@/lib/events';
import { eventTeaser } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

/** The next rendez-vous in one pill: when, then what, linking to its page. */
export default function NextEventPill({ event }: { event: EventSummary }) {
  return (
    <Link to={eventPath(event)} className="group mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-[13px] text-white/75 backdrop-blur transition-colors hover:border-gold-400/50 hover:text-white">
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-400/15 px-2.5 py-0.5 text-[11px] font-medium text-gold-400">
        <PulseDot />
        {isLive(event) ? 'En direct' : eventTeaser(event.startDate)}
      </span>
      <span className="truncate">{TYPE_LABEL[event.type]}{event.format === 'ONLINE' ? ' en ligne' : ''} : {event.title}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
