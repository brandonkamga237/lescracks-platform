import { useEffect, useState } from 'react';

import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';

const FAILURE = 'L’abonnement a échoué. Réessaie dans un instant.';

/**
 * Who is looking decides how they subscribe: a member in one click, a visitor with an email
 * they then confirm. `null` means not known yet, or nothing to offer (an admin, a session still loading).
 */
export type NewsletterAudience = 'member' | 'visitor' | null;

export interface Newsletter {
  audience: NewsletterAudience;
  /** For a member: already subscribed, or null while it is being checked. */
  subscribed: boolean | null;
  busy: boolean;
  /** A visitor's email went out; they still have to confirm it. */
  emailSent: boolean;
  failure: string;
  subscribeMember: () => Promise<void>;
  subscribeEmail: (email: string) => Promise<boolean>;
}

export function useNewsletter(): Newsletter {
  const { isSignedIn, isAdmin, isLoading, user } = useSession();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [failure, setFailure] = useState('');

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

  const audience: NewsletterAudience = isLoading || isAdmin ? null : isSignedIn ? (user ? 'member' : null) : 'visitor';

  async function subscribeMember() {
    setBusy(true);
    setFailure('');
    try {
      const response = await api.newsletterSubscribe();
      setSubscribed(response.status === 'SUBSCRIBED');
      track('Abonnement newsletter', { compte: 'membre' });
    } catch {
      setFailure(FAILURE);
    } finally {
      setBusy(false);
    }
  }

  async function subscribeEmail(email: string) {
    setBusy(true);
    setFailure('');
    setEmailSent(false);
    try {
      await api.newsletterPublicSubscribe({ email: email.trim() });
      setEmailSent(true);
      track('Abonnement newsletter', { compte: 'visiteur' });
      return true;
    } catch {
      setFailure(FAILURE);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { audience, subscribed, busy, emailSent, failure, subscribeMember, subscribeEmail };
}
