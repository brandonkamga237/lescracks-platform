import { useEffect, useState } from 'react';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

export default function NewsletterBar() {
  const { isSignedIn, isAdmin, isLoading, user } = useSession();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);
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

  if (!visible || isLoading || isAdmin || (isSignedIn && !user) || subscribed === true) return null;

  async function subscribe() {
    setBusy(true);
    setFailure('');
    try {
      const response = await api.newsletterSubscribe();
      setSubscribed(response.status === 'SUBSCRIBED');
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
      setEmail('');
    } catch {
      setFailure('L’abonnement a échoué. Réessaie dans un instant.');
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="border-b border-gold-400/20 bg-gold-400/[0.08] px-4 py-2 text-center text-xs text-t2 sm:text-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>
          Les nouveaux contenus et rendez-vous arrivent par email.
          {isSignedIn ? ' Ne manque rien.' : ' Inscris-toi pour les recevoir.'}
        </span>
        {isSignedIn && user && subscribed === false && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void subscribe()}
            className="font-medium text-gold-300 underline underline-offset-4 transition-colors hover:text-gold-400 disabled:opacity-50"
          >
            {busy ? 'Abonnement…' : 'M’abonner à la newsletter'}
          </button>
        )}
        {isSignedIn && user && subscribed === null && <span className="sr-only">Vérification de ton abonnement…</span>}
        {!isSignedIn && !emailSuccess && (
          <form onSubmit={subscribePublic} className="flex flex-wrap items-center justify-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ton@email.com"
              className="w-48 rounded-xl border border-gold-400/30 bg-noir-900 px-3 py-1.5 text-sm text-t1 placeholder:text-t4 focus:border-gold-400 focus:outline-none"
              disabled={emailBusy}
            />
            <button
              type="submit"
              disabled={emailBusy}
              className="rounded-xl bg-gold-400 px-3 py-1.5 text-sm font-medium text-noir-950 transition-colors hover:bg-gold-300 disabled:opacity-50"
            >
              {emailBusy ? '…' : 'M’abonner'}
            </button>
          </form>
        )}
        {!isSignedIn && emailSuccess && (
          <span className="font-medium text-gold-300">Merci, tu es bien inscrit.</span>
        )}
        {failure && <span role="alert" className="text-red-300">{failure}</span>}
        <button type="button" onClick={() => setVisible(false)} aria-label="Masquer ce message" className="ml-1 rounded px-1 text-t4 transition-colors hover:text-t1">×</button>
      </div>
    </div>
  );
}
