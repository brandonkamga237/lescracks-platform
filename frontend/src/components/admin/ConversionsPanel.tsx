import { Link } from 'react-router-dom';

import { BarList, Panel } from '@/components/admin/viz';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';

interface ConversionsPanelProps {
  days: number;
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function rate(part: number, whole: number) {
  if (whole <= 0) return '—';
  const value = (part / whole) * 100;
  return `${value < 1 && part > 0 ? '< 1' : Math.round(value)} %`;
}

interface StepProps {
  label: string;
  value: number;
  /** Share of the previous step, shown under the figure. */
  from?: { value: number; label: string };
}

function Step({ label, value, from }: StepProps) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xl font-semibold tabular-nums text-t1">{value.toLocaleString('fr-FR')}</p>
      <p className="text-xs text-t3">{label}</p>
      {from && <p className="mt-0.5 text-[11px] font-semibold text-gold-ink">{rate(value, from.value)} {from.label}</p>}
    </div>
  );
}

/**
 * What turns visits into members, and members into participants. Read from the platform's own
 * data, so it works even when the visit counter (Umami) is off.
 */
export default function ConversionsPanel({ days }: ConversionsPanelProps) {
  const conversions = useApi((signal) => adminApi.conversions(days, signal), [days]);
  const data = conversions.data;
  if (conversions.loading && !data) return <p className="mt-10 text-sm text-t3">Chargement des conversions…</p>;
  if (conversions.error || !data) return null;
  const signups = data.signupsBySource.reduce((sum, item) => sum + item.count, 0);

  return (
    <section aria-labelledby="conversions-title" className="mt-10">
      <h2 id="conversions-title" className="font-display text-xl font-bold text-t1">Ce qui fait venir des membres</h2>
      <p className="mt-1 text-sm text-t3">
        {signups.toLocaleString('fr-FR')} inscription{signups > 1 ? 's' : ''} sur la période. Les visites ne suffisent pas : voici ce qui transforme un visiteur en membre, puis en participant.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Par où ils sont arrivés" subtitle="Le canal qui a amené chaque nouveau membre">
          {data.signupsBySource.length ? <BarList items={data.signupsBySource} /> : (
            <p className="py-8 text-center text-sm text-t3">Aucune inscription sur la période.</p>
          )}
        </Panel>
        <Panel title="Les pages qui font s’inscrire" subtitle="Première page vue par les nouveaux membres">
          {data.signupsByLandingPage.length ? <BarList items={data.signupsByLandingPage} format={(path) => path === '/' ? 'Accueil' : path} /> : (
            <p className="py-8 text-center text-sm text-t3">Pas encore de donnée.</p>
          )}
        </Panel>
      </div>

      <Panel className="mt-4" title="Chaque événement, de la vue à la participation" subtitle="Personnes qui ont ouvert la page, se sont inscrites, puis sont venues ou ont rendu un projet">
        {data.events.length === 0 ? <p className="py-8 text-center text-sm text-t3">Aucun événement publié.</p> : (
          <ul className="divide-y divide-line-soft">
            {data.events.map((event) => (
              <li key={event.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] sm:items-center">
                <div className="min-w-0">
                  <Link to={`/admin/evenements/${event.id}`} className="link block truncate text-sm">{event.title}</Link>
                  <p className="text-xs text-t4">{dayFormat.format(new Date(event.startDate))}</p>
                </div>
                <Step label="vues de la page" value={event.views} />
                <Step label="inscrits" value={event.registrations} from={{ value: event.views, label: 'des visiteurs' }} />
                {event.acceptsSubmissions
                  ? <Step label="projets rendus" value={event.projects} from={{ value: event.registrations, label: 'des inscrits' }} />
                  : <Step label="présents" value={event.attended} from={{ value: event.registrations, label: 'des inscrits' }} />}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  );
}
