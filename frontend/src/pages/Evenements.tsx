import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { EventKind, EventPhase, EventSummary } from '@/services/types';

const KIND_LABEL: Record<EventKind, string> = {
  BOOTCAMP: 'Bootcamp',
  WORKSHOP: 'Atelier',
};

const PHASE_LABEL: Record<EventPhase, string> = {
  UPCOMING: 'À venir',
  RUNNING: 'En cours',
  PAST: 'Terminé',
};

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });
const yearFormat = new Intl.DateTimeFormat('fr-FR', { year: 'numeric' });

function EventRow({ event }: { event: EventSummary }) {
  const start = new Date(event.startsAt);

  return (
    <Link
      to={`/evenements/${event.slug}`}
      className="group flex gap-6 border-b border-line-soft py-6 transition-colors hover:border-line-strong sm:gap-10"
    >
      {/* The date is the anchor: an event is a moment before it is a subject. */}
      <time dateTime={event.startsAt} className="w-16 shrink-0 text-center">
        <span className="block font-display text-xl font-semibold text-t1">
          {dayFormat.format(start)}
        </span>
        <span className="block text-xs text-t4">{yearFormat.format(start)}</span>
      </time>

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-medium text-t1 transition-colors group-hover:text-gold-300">
          {event.title}
        </h2>
        {event.summary && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-t3">{event.summary}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-t4">
          <span className="text-t3">{KIND_LABEL[event.kind]}</span>
          {event.location && (
            <>
              <span aria-hidden>·</span>
              <span>{event.location}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className={event.phase === 'PAST' ? 'text-t4' : 'text-gold-400'}>
            {PHASE_LABEL[event.phase]}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Evenements() {
  const [params, setParams] = useSearchParams();
  const past = params.get('passes') === '1';

  const events = useApi(
    (signal) => api.events({ upcoming: !past, size: 50 }, signal),
    [past],
  );

  const list = events.data?.content ?? [];

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold leading-tight text-t1 sm:text-5xl">
            Bootcamps et ateliers
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-t3">
            Des rendez-vous datés, en petit groupe. Ce qu’on y fait est annoncé à l’avance,
            et ce qu’on en retire est attesté à la fin.
          </p>
        </header>

        <div className="mt-10 flex gap-5 border-b border-line-soft pb-4 text-sm">
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className={!past ? 'text-t1' : 'text-t4 hover:text-t2'}
          >
            À venir
          </button>
          <button
            type="button"
            onClick={() => setParams({ passes: '1' }, { replace: true })}
            className={past ? 'text-t1' : 'text-t4 hover:text-t2'}
          >
            Tous, passés compris
          </button>
        </div>

        <section aria-live="polite">
          {events.loading && <p className="py-16 text-center text-t4">Chargement…</p>}

          {events.error && (
            <div className="py-16 text-center">
              <p className="text-t2">{events.error.message}</p>
              <button
                type="button"
                onClick={events.reload}
                className="mt-4 text-sm text-gold-400 underline underline-offset-4"
              >
                Réessayer
              </button>
            </div>
          )}

          {!events.loading && !events.error && list.length === 0 && (
            <p className="py-16 text-center text-t3">
              {past
                ? 'Aucun événement pour le moment.'
                : 'Rien de programmé pour l’instant. Les prochains seront annoncés ici.'}
            </p>
          )}

          {list.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </section>
      </div>
    </Layout>
  );
}
