import EventRow from '@/components/events/EventRow';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Band } from '@/components/ui/band';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import type { EventSummary } from '@/services/types';

/** The next rendez-vous, laid over the ivory band. */
export default function UpcomingEvents({ events }: { events: EventSummary[] }) {
  return (
    <Band id="rendez-vous" overlap labelledBy="events-title">
      <Container className="pb-20 pt-20 sm:pt-28">
        <SectionHeading id="events-title" eyebrow="Agenda" title={['Prochains rendez-vous.', { text: 'Ateliers, webinaires et conférences.', className: 'text-white/40' }]} action={{ to: '/rendez-vous', label: 'Tout l’agenda' }} />
        <Stagger className="mt-14 border-t border-white/10">
          {events.map((event) => <StaggerItem key={event.id}><EventRow event={event} /></StaggerItem>)}
        </Stagger>
      </Container>
    </Band>
  );
}
