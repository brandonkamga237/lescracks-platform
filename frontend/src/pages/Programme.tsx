import { Link } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

/**
 * The Accompagnement 360.
 *
 * It has no lifecycle, unlike an event: it opens and closes on a decision. So the page says
 * which of the two it is, first and plainly, instead of showing a button that will refuse.
 */
export default function Programme() {
  const mentorship = useApi((signal) => api.mentorship(signal), []);
  const proof = useApi((signal) => api.proofOfWork(signal), []);
  const loaded = mentorship.data;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        {mentorship.loading && <p className="py-20 text-center text-t4">Chargement…</p>}
        {mentorship.error && (
          <p className="py-20 text-center text-t2">{mentorship.error.message}</p>
        )}

        {loaded && (
          <>
            <p className="text-sm uppercase tracking-widest text-t4">
              {loaded.open ? (
                <span className="text-gold-400">Candidatures ouvertes</span>
              ) : (
                'Candidatures fermées'
              )}
            </p>

            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-t1 sm:text-5xl">
              {loaded.title}
            </h1>

            {loaded.summary && (
              <p className="mt-5 text-lg leading-relaxed text-t2">{loaded.summary}</p>
            )}

            {loaded.description && (
              <div className="mt-8 whitespace-pre-line leading-relaxed text-t2">
                {loaded.description}
              </div>
            )}

            {/* Counted, not claimed: these come from participations that were actually
                completed, and each one has an attestation anybody can verify. */}
            {proof.data && proof.data.peopleHelped > 0 && (
              <dl className="mt-14 grid grid-cols-3 gap-6 border-y border-line-soft py-8 text-center">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-t4">Accompagnées</dt>
                  <dd className="mt-2 font-display text-2xl font-semibold text-t1">
                    {proof.data.peopleHelped}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-t4">Parcours terminés</dt>
                  <dd className="mt-2 font-display text-2xl font-semibold text-t1">
                    {proof.data.completed}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-t4">En cours</dt>
                  <dd className="mt-2 font-display text-2xl font-semibold text-t1">
                    {proof.data.inProgress}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-12">
              {loaded.open ? (
                <Link
                  to="/postuler"
                  className="inline-block rounded-full bg-gold-400 px-6 py-3 font-medium text-black transition-colors hover:bg-gold-300"
                >
                  Postuler
                </Link>
              ) : (
                <div className="rounded border border-line-soft px-5 py-4">
                  <p className="text-t2">
                    Les candidatures rouvriront. En attendant, le catalogue et les événements
                    sont ouverts à tout le monde.
                  </p>
                  <Link
                    to="/ressources"
                    className="mt-3 inline-block text-sm text-gold-400 underline underline-offset-4"
                  >
                    Commencer par les ressources
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
