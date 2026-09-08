import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

/**
 * A single line at the very top of every page — the newsletter ask, kept to the
 * height of an announcement so it never eats the reading space below.
 *
 * Subscription is tied to a member account, so visitors get the invitation and
 * members get the action itself.
 */
export default function NewsletterBar() {
  const { isSignedIn, isAdmin, isLoading } = useSession();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    if (!isSignedIn || isAdmin) {
      setSubscribed(null);
      return;
    }
    const controller = new AbortController();
    api.newsletterStatus(controller.signal)
      .then((response) => setSubscribed(response.status === 'SUBSCRIBED'))
      .catch(() => setSubscribed(null));
    return () => controller.abort();
  }, [isSignedIn, isAdmin]);

  if (!visible || isLoading || isAdmin || subscribed === true) return null;

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

  return (
    <div className="border-b border-gold-400/20 bg-gold-400/[0.08] px-4 py-2 text-center text-xs text-t2 sm:text-sm">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>
          Les nouveaux contenus et rendez-vous arrivent par email.
          {isSignedIn ? ' Ne manque rien.' : ' Crée ton compte pour les recevoir.'}
        </span>
        {isSignedIn && subscribed === false && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void subscribe()}
            className="font-medium text-gold-300 underline underline-offset-4 transition-colors hover:text-gold-400 disabled:opacity-50"
          >
            {busy ? 'Abonnement…' : 'M’abonner à la newsletter'}
          </button>
        )}
        {isSignedIn && subscribed === null && <span className="sr-only">Vérification de ton abonnement…</span>}
        {!isSignedIn && (
          <Link to="/inscription" className="font-medium text-gold-300 underline underline-offset-4 transition-colors hover:text-gold-400">
            Rejoindre LesCracks
          </Link>
        )}
        {failure && <span role="alert" className="text-red-300">{failure}</span>}
        <button type="button" onClick={() => setVisible(false)} aria-label="Masquer ce message" className="ml-1 rounded px-1 text-t4 transition-colors hover:text-t1">×</button>
      </p>
    </div>
  );
}
