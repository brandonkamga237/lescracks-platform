import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

/**
 * Applying, to the 360 or to an event.
 *
 * No account is required and none is offered here: asking someone to register before they
 * have told you anything is what loses them. The backend attaches the application to an
 * account later, on its own, if the address turns out to belong to one.
 */
export default function Postuler() {
  const [params] = useSearchParams();
  const eventId = params.get('evenement') ? Number(params.get('evenement')) : undefined;

  const mentorship = useApi((signal) => api.mentorship(signal), []);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  async function submit(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    const data = new FormData(form.currentTarget);
    setSending(true);
    setFailure(null);

    try {
      await api.apply({
        target: eventId ? 'EVENT' : 'MENTORSHIP',
        eventId,
        fullName: String(data.get('fullName') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? '') || undefined,
        motivation: String(data.get('motivation') ?? '') || undefined,
      });
      setSent(true);
    } catch (error) {
      // The backend writes these sentences in French for a reason; showing our own would
      // drift from what it actually refused.
      setFailure(
        error instanceof ApiError ? error : new ApiError(0, { message: 'Le serveur est injoignable.' }),
      );
    } finally {
      setSending(false);
    }
  }

  const closed = !eventId && mentorship.data && !mentorship.data.open;

  if (sent) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-gold-400" aria-hidden />
          <h1 className="mt-6 font-display text-2xl font-semibold text-t1">
            Candidature reçue
          </h1>
          <p className="mt-4 leading-relaxed text-t3">
            Nous la lisons et revenons vers vous par e-mail. En attendant, le catalogue est
            ouvert&nbsp;: il n’y a rien à attendre pour commencer.
          </p>
          <Link
            to="/ressources"
            className="mt-8 inline-block rounded-full border border-line px-6 py-2.5 text-t2 transition-colors hover:border-gold-400 hover:text-t1"
          >
            Voir les ressources
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <h1 className="font-display text-3xl font-semibold leading-tight text-t1 sm:text-4xl">
          {eventId ? 'S’inscrire à l’événement' : 'Postuler à l’Accompagnement 360'}
        </h1>
        <p className="mt-4 leading-relaxed text-t3">
          Quelques lignes suffisent. Ce qui compte, c’est où vous en êtes et ce que vous
          voulez atteindre — pas votre CV.
        </p>

        {closed && (
          <p className="mt-8 rounded border border-line px-5 py-4 text-t2">
            Les candidatures à l’Accompagnement 360 sont fermées pour le moment. Elles
            rouvriront&nbsp;; les ressources et les événements restent accessibles.
          </p>
        )}

        {!closed && (
          <form onSubmit={submit} className="mt-10 space-y-6" noValidate>
            <div>
              <label htmlFor="fullName" className="block text-sm text-t2">
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                autoComplete="name"
                className="mt-2 w-full border-b border-line bg-transparent py-2 text-t1 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-t2">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full border-b border-line bg-transparent py-2 text-t1 focus:border-gold-400 focus:outline-none"
              />
              {failure?.fields?.email && (
                <p className="mt-2 text-sm text-error">{failure.fields.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm text-t2">
                Téléphone <span className="text-t4">(facultatif)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="mt-2 w-full border-b border-line bg-transparent py-2 text-t1 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="motivation" className="block text-sm text-t2">
                Où en êtes-vous, et où voulez-vous aller&nbsp;?
              </label>
              <textarea
                id="motivation"
                name="motivation"
                rows={5}
                className="mt-2 w-full resize-y border-b border-line bg-transparent py-2 leading-relaxed text-t1 focus:border-gold-400 focus:outline-none"
              />
            </div>

            {failure && !failure.fields && (
              <p role="alert" className="rounded border border-line px-4 py-3 text-t2">
                {failure.message}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="rounded-full bg-gold-400 px-6 py-3 font-medium text-black transition-colors hover:bg-gold-300 disabled:opacity-50"
            >
              {sending ? 'Envoi…' : 'Envoyer ma candidature'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
