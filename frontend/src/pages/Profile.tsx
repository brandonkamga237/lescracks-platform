import { Link } from 'react-router-dom';
import { BadgeCheck, Copy } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import type { Participation, ParticipationStatus } from '@/services/types';

const STATUS_LABEL: Record<ParticipationStatus, string> = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ABANDONED: 'Interrompu',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function ParticipationRow({ participation }: { participation: Participation }) {
  const code = participation.attestationCode;

  return (
    <li className="border-b border-line-soft py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-lg text-t1">{participation.programme}</h3>
        <span
          className={
            participation.status === 'COMPLETED'
              ? 'text-sm text-gold-400'
              : 'text-sm text-t4'
          }
        >
          {STATUS_LABEL[participation.status]}
        </span>
      </div>

      <p className="mt-1 text-sm text-t4">
        Commencé le {dateFormat.format(new Date(participation.startedAt))}
        {participation.completedAt &&
          ` · terminé le ${dateFormat.format(new Date(participation.completedAt))}`}
        {participation.cohort && ` · promotion ${participation.cohort}`}
      </p>

      {code && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-line-soft px-4 py-3">
          <BadgeCheck className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
          <span className="font-mono text-sm text-t2">{code}</span>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(
                `${window.location.origin}/attestations/${code}`,
              )}
              className="flex items-center gap-1.5 text-t4 transition-colors hover:text-t2"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copier le lien
            </button>
            <Link
              to={`/attestations/${code}`}
              className="text-gold-400 underline underline-offset-4"
            >
              Voir
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * What someone has followed, and what they can show for it.
 *
 * The attestation link is the point of the page: a code that stays in a database proves
 * nothing, and the person who earned it is the one who needs to hand it to somebody.
 */
export default function Profile() {
  const { name, email } = useSession();
  const participations = useApi((signal) => api.myParticipations(signal), []);
  const list = participations.data ?? [];

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <header>
          <h1 className="font-display text-3xl font-semibold text-t1 sm:text-4xl">
            {name ?? 'Mon profil'}
          </h1>
          {email && <p className="mt-2 text-t4">{email}</p>}
          <p className="mt-4 text-sm text-t4">
            Votre mot de passe et vos connexions Google ou GitHub se gèrent depuis votre
            compte, pas ici.
          </p>
        </header>

        <section className="mt-14">
          <h2 className="font-display text-xl font-medium text-t1">Mon parcours</h2>

          {participations.loading && <p className="py-10 text-t4">Chargement…</p>}
          {participations.error && (
            <p className="py-10 text-t2">{participations.error.message}</p>
          )}

          {!participations.loading && !participations.error && list.length === 0 && (
            <div className="mt-6 rounded border border-line-soft px-5 py-6">
              <p className="leading-relaxed text-t3">
                Vous ne suivez rien pour l’instant. L’Accompagnement 360 et les événements
                démarrent par une candidature&nbsp;; les ressources, elles, sont ouvertes tout
                de suite.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link to="/ressources" className="text-gold-400 underline underline-offset-4">
                  Le catalogue
                </Link>
                <Link to="/programme" className="text-gold-400 underline underline-offset-4">
                  L’Accompagnement 360
                </Link>
              </div>
            </div>
          )}

          {list.length > 0 && (
            <ul className="mt-4">
              {list.map((participation) => (
                <ParticipationRow key={participation.id} participation={participation} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
