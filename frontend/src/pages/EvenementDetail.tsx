import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { EventKind, EventPhase } from '@/services/types';

const KIND_LABEL: Record<EventKind, string> = { BOOTCAMP: 'Bootcamp', WORKSHOP: 'Atelier' };
const PHASE_LABEL: Record<EventPhase, string> = {
  UPCOMING: 'À venir',
  RUNNING: 'En cours',
  PAST: 'Terminé',
};

const fullDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
const shortDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export default function EvenementDetail() {
  const { slug = '' } = useParams();
  const event = useApi((signal) => api.event(slug, signal), [slug]);
  const loaded = event.data;

  return (
    <Layout>
      <article className="mx-auto max-w-2xl px-6 py-12 sm:py-20">
        <Link
          to="/evenements"
          className="inline-flex items-center gap-2 text-sm text-t4 transition-colors hover:text-t2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Les événements
        </Link>

        {event.loading && <p className="py-20 text-center text-t4">Chargement…</p>}
        {event.error && <p className="py-20 text-center text-t2">{event.error.message}</p>}

        {loaded && (
          <>
            <header className="mt-10">
              <div className="flex flex-wrap items-center gap-x-3 text-sm">
                <span className="text-gold-400">{KIND_LABEL[loaded.kind]}</span>
                <span className="text-t4" aria-hidden>·</span>
                <span className={loaded.phase === 'PAST' ? 'text-t4' : 'text-t2'}>
                  {PHASE_LABEL[loaded.phase]}
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-t1 sm:text-4xl">
                {loaded.title}
              </h1>

              {loaded.summary && (
                <p className="mt-4 text-lg leading-relaxed text-t2">{loaded.summary}</p>
              )}
            </header>

            <dl className="mt-10 space-y-4 border-y border-line-soft py-6">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-t4" aria-hidden />
                <div>
                  <dt className="sr-only">Dates</dt>
                  <dd className="text-t2">
                    {fullDate.format(new Date(loaded.startsAt))}
                    {loaded.endsAt && (
                      <span className="block text-sm text-t4">
                        jusqu’au {shortDate.format(new Date(loaded.endsAt))}
                      </span>
                    )}
                  </dd>
                </div>
              </div>

              {loaded.location && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-t4" aria-hidden />
                  <div>
                    <dt className="sr-only">Lieu</dt>
                    <dd className="text-t2">{loaded.location}</dd>
                  </div>
                </div>
              )}

              {loaded.capacity != null && (
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-t4" aria-hidden />
                  <div>
                    <dt className="sr-only">Places</dt>
                    <dd className="text-t2">{loaded.capacity} places</dd>
                  </div>
                </div>
              )}
            </dl>

            {loaded.description && (
              <div className="mt-8 whitespace-pre-line leading-relaxed text-t2">
                {loaded.description}
              </div>
            )}

            {/* Registering needs no account: people apply first and register after. */}
            {loaded.acceptingApplications ? (
              <Link
                to={`/postuler?evenement=${loaded.id}`}
                className="mt-12 inline-block rounded-full bg-gold-400 px-6 py-3 font-medium text-black transition-colors hover:bg-gold-300"
              >
                S’inscrire à cet événement
              </Link>
            ) : (
              <p className="mt-12 rounded border border-line-soft px-5 py-4 text-t3">
                {loaded.phase === 'PAST'
                  ? 'Cet événement est terminé. Les prochains sont annoncés sur la page des événements.'
                  : 'Les inscriptions ne sont pas encore ouvertes.'}
              </p>
            )}
          </>
        )}
      </article>
    </Layout>
  );
}
