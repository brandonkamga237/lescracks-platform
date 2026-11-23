import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { isLive } from '@/lib/events';
import { eventTeaser } from '@/lib/eventMoment';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

interface NextEventCardProps {
  event: EventSummary;
  onNavigate?: () => void;
}

/** The next rendez-vous as a gold-edged card, for a menu or a sidebar. */
export default function NextEventCard({ event, onNavigate }: NextEventCardProps) {
  return (
    <Link to={eventPath(event)} onClick={onNavigate} className="flex items-center justify-between gap-4 rounded-2xl border border-gold-400/20 bg-gradient-to-r from-gold-400/[0.12] to-transparent p-4">
      <span className="min-w-0">
        <span className="block text-xs font-medium text-gold-400">{isLive(event) ? 'En direct maintenant' : `Prochain rendez-vous · ${eventTeaser(event.startDate)}`}</span>
        <span className="mt-1 block truncate font-medium">{event.title}</span>
      </span>
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-black"><ArrowRight className="h-4 w-4" /></span>
    </Link>
  );
}
