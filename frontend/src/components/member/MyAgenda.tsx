import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { ErrorState } from '@/components/common/States';
import MyEventRow from '@/components/member/MyEventRow';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import type { MyAgenda as Agenda } from '@/lib/myEvents';

const PAST_SHOWN = 4;

interface MyAgendaProps {
  agenda: Agenda | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}

/** The rendez-vous the member signed up for: what is on now and next, then the last ones they had. */
export default function MyAgenda({ agenda, loading, failed, onRetry }: MyAgendaProps) {
  const ahead = agenda ? [...agenda.live.map((event) => ({ event, tense: 'live' as const })), ...agenda.coming.map((event) => ({ event, tense: 'coming' as const }))] : [];
  const past = agenda?.past.slice(0, PAST_SHOWN) ?? [];

  return (
    <section id="mes-rendez-vous" aria-labelledby="my-events-title">
      <Container className="pb-20 pt-4 sm:pb-28">
        <SectionHeading id="my-events-title" eyebrow="Mes rendez-vous" title={['Ton agenda.', { text: 'Ceux auxquels tu es inscrit.', className: 'text-white/40' }]} action={{ to: '/rendez-vous', label: 'Tout l’agenda' }} />

        {failed && <div className="mt-14"><ErrorState title="Impossible de charger tes rendez-vous." onRetry={onRetry} /></div>}
        {loading && !agenda && <div aria-hidden="true" className="mt-14 space-y-px border-t border-white/10">{[0, 1].map((row) => <div key={row} className="h-[97px] animate-pulse border-b border-white/10 bg-white/[0.02] motion-reduce:animate-none" />)}</div>}

        {agenda && ahead.length === 0 && (
          <div className="mt-14 flex flex-col items-start gap-5 rounded-3xl border border-dashed border-white/15 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-xl text-white/60">Tu n’es inscrit à aucun rendez-vous à venir. Choisis un atelier ou une conférence : chaque participation te vaut une attestation vérifiable.</p>
            <Link to="/rendez-vous" className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-gold-400">Voir l’agenda<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          </div>
        )}
        {ahead.length > 0 && (
          <Stagger className="mt-14 border-t border-white/10">
            {ahead.map(({ event, tense }) => <StaggerItem key={event.id}><MyEventRow event={event} tense={tense} /></StaggerItem>)}
          </Stagger>
        )}

        {past.length > 0 && (
          <>
            <h3 className="mt-16 text-sm font-medium text-white/50">Déjà passés</h3>
            <Stagger className="mt-4 border-t border-white/10">
              {past.map((event) => <StaggerItem key={event.id}><MyEventRow event={event} tense="past" /></StaggerItem>)}
            </Stagger>
          </>
        )}
      </Container>
    </section>
  );
}
