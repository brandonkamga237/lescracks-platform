import { useEffect, useState } from 'react';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { track } from '@/lib/analytics';

/** The newsletter offer, once per page, after the content: a strip above the header cost every page its first lines. */
export default function NewsletterBar() {
  const { isSignedIn, isAdmin, isLoading, user } = useSession();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    if (!user || isAdmin) {
      setSubscribed(null);
      return;
    }
    const controller = new AbortController();
    api.newsletterStatus(controller.signal)
      .then((response) => setSubscribed(response.status === 'SUBSCRIBED'))
      .catch(() => setSubscribed(null));
    return () => controller.abort();
  }, [user, isAdmin]);

  if (isLoading || isAdmin || (isSignedIn && !user) || subscribed === true) return null;

  async function subscribe() {
    setBusy(true);
    setFailure('');
    try {
      const response = await api.newsletterSubscribe();
      setSubscribed(response.status === 'SUBSCRIBED');
      track('Abonnement newsletter', { compte: 'membre' });
    } catch {
      setFailure('L’abonnement a échoué. Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  async function subscribePublic(event: React.FormEvent) {
    event.preventDefault();
    setEmailBusy(true);
    setFailure('');
    setEmailSuccess(false);
    try {
      await api.newsletterPublicSubscribe({ email: email.trim() });
      setEmailSuccess(true);
      track('Abonnement newsletter', { compte: 'visiteur' });
      setEmail('');
    } catch {
      setFailure('L’abonnement a échoué. Réessaie dans un instant.');
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <section aria-label="Newsletter" className="border-t border-line-soft bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-t2 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <p className="text-sm text-t2">
          <span className="font-medium text-t1">Les nouveaux articles et rendez-vous arrivent par email.</span>
          {isSignedIn ? ' Ne manque rien.' : ' Inscris-toi pour les recevoir.'}
        </p>
        {isSignedIn && user && subscribed === false && (
          <button type="button" disabled={busy} onClick={() => void subscribe()} className="btn-primary shrink-0 self-start lg:self-auto">
            {busy ? 'Abonnement…' : 'M’abonner à la newsletter'}
          </button>
        )}
        {isSignedIn && user && subscribed === null && <span className="sr-only">Vérification de ton abonnement…</span>}
        {!isSignedIn && !emailSuccess && (
          <form onSubmit={subscribePublic} className="flex w-full gap-2 lg:w-auto">
            {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ton@email.com"
              aria-label="Ton adresse email"
              className="input min-w-0 flex-1 text-base lg:w-72 lg:flex-none"
              disabled={emailBusy}
            />
            <button type="submit" disabled={emailBusy} className="btn-primary shrink-0">
              {emailBusy ? '…' : 'M’abonner'}
            </button>
          </form>
        )}
        {!isSignedIn && emailSuccess && (
          <p role="status" className="text-sm font-medium text-gold-ink">Presque fini : confirme ton inscription avec le lien reçu par email.</p>
        )}
        {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
      </div>
    </section>
  );
}
