import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import ResourceCard from '@/components/resources/ResourceCard';
import { useApi } from '@/hooks/useApi';
import { EFFORT_BANDS } from '@/lib/effort';
import { api } from '@/services/api';

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long' });

/**
 * The front door.
 *
 * It opens on the same question the catalogue is organised around — how much time do you
 * have — rather than on a claim about ourselves. Someone arriving with twenty minutes can
 * be reading something within two clicks, without an account.
 *
 * The numbers further down are counted, not asserted: they come from participations that
 * were actually completed, each with an attestation anybody can verify.
 */
export default function Landing() {
  const recent = useApi((signal) => api.resources({ size: 5 }, signal), []);
  const upcoming = useApi((signal) => api.events({ upcoming: true, size: 3 }, signal), []);
  const mentorship = useApi((signal) => api.mentorship(signal), []);
  const proof = useApi((signal) => api.proofOfWork(signal), []);

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 sm:pt-28">
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] text-t1 sm:text-6xl">
          Apprendre la tech quand on part de zéro,
          <span className="text-t3"> avec le temps qu’on a.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-t3">
          Des ressources rangées par ce qu’elles vous demandent, des événements datés, et un
          accompagnement individuel quand vous voulez aller plus vite.
        </p>

        {/* The catalogue's own question, asked here so the first click already filters. */}
        <div className="mt-10 flex flex-wrap gap-3">
          {EFFORT_BANDS.map((band) => (
            <Link
              key={band.id}
              to="/ressources"
              className="rounded-full border border-line px-5 py-2.5 transition-colors hover:border-gold-400"
            >
              <span className="block text-sm font-medium text-t1">{band.label}</span>
              <span className="block text-xs text-t4">{band.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      {(recent.data?.content.length ?? 0) > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-line-soft pb-3">
            <h2 className="font-display text-xl font-medium text-t1">Derniers ajouts</h2>
            <Link
              to="/ressources"
              className="flex items-center gap-1.5 text-sm text-t4 transition-colors hover:text-t2"
            >
              Tout le catalogue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {recent.data?.content.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </section>
      )}

      {(upcoming.data?.content.length ?? 0) > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-line-soft pb-3">
            <h2 className="font-display text-xl font-medium text-t1">Prochains rendez-vous</h2>
            <Link
              to="/evenements"
              className="flex items-center gap-1.5 text-sm text-t4 transition-colors hover:text-t2"
            >
              Tous les événements
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {upcoming.data?.content.map((event) => (
            <Link
              key={event.id}
              to={`/evenements/${event.slug}`}
              className="group flex items-baseline gap-6 border-b border-line-soft py-5"
            >
              <time
                dateTime={event.startsAt}
                className="w-28 shrink-0 font-mono text-sm text-gold-400"
              >
                {dayFormat.format(new Date(event.startsAt))}
              </time>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-t1 transition-colors group-hover:text-gold-300">
                  {event.title}
                </span>
                {event.location && (
                  <span className="mt-0.5 block text-sm text-t4">{event.location}</span>
                )}
              </span>
            </Link>
          ))}
        </section>
      )}

      {mentorship.data && (
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded border border-line-soft px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-sm uppercase tracking-widest text-t4">
              {mentorship.data.open ? (
                <span className="text-gold-400">Candidatures ouvertes</span>
              ) : (
                'Candidatures fermées'
              )}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-t1">
              {mentorship.data.title}
            </h2>
            {mentorship.data.summary && (
              <p className="mt-3 max-w-xl leading-relaxed text-t3">{mentorship.data.summary}</p>
            )}

            {proof.data && proof.data.peopleHelped > 0 && (
              <p className="mt-6 text-sm text-t4">
                {proof.data.peopleHelped} personnes accompagnées ·{' '}
                {proof.data.completed} parcours terminés, chacun avec une attestation
                vérifiable.
              </p>
            )}

            <Link
              to={mentorship.data.open ? '/postuler' : '/programme'}
              className="mt-8 inline-flex items-center gap-2 text-gold-400 underline underline-offset-4"
            >
              {mentorship.data.open ? 'Postuler' : 'En savoir plus'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}
