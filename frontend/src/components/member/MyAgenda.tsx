import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

import DashSection from '@/components/member/DashSection';
import MyEventRow from '@/components/member/MyEventRow';
import { Button } from '@/components/ui/button';
import { ErrorPanel, RowsLoading } from '@/components/ui/panels';
import type { MyAgenda as Agenda } from '@/lib/myEvents';

const PAST_SHOWN = 3;

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
    <DashSection id="my-events-title" title="Mes rendez-vous" Icon={CalendarCheck} more={{ to: '/rendez-vous', label: 'Agenda' }}>
      {failed && <ErrorPanel title="Impossible de charger tes rendez-vous." onRetry={onRetry} />}
      {loading && !agenda && <RowsLoading rows={2} label="Chargement de tes rendez-vous…" />}
      {agenda && ahead.length === 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-white/55">Aucune inscription à venir.</p>
          <Button asChild size="sm" variant="outline" className="shrink-0"><Link to="/rendez-vous">Choisir</Link></Button>
        </div>
      )}
      {ahead.length > 0 && (
        <ul className="border-t border-white/10">
          {ahead.map(({ event, tense }) => <li key={event.id}><MyEventRow event={event} tense={tense} /></li>)}
        </ul>
      )}
      {past.length > 0 && (
        <>
          <h3 className="mb-1 mt-6 text-xs font-medium text-white/40">Déjà passés</h3>
          <ul className="border-t border-white/10">
            {past.map((event) => <li key={event.id}><MyEventRow event={event} tense="past" /></li>)}
          </ul>
        </>
      )}
    </DashSection>
  );
}
