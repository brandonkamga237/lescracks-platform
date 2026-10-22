import { useState } from 'react';

import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { EventSummary } from '@/services/types';

export interface EventRegistrationState {
  /** A signed-in member, the only one who can register in one tap. */
  member: boolean;
  isAdmin: boolean;
  /** The session or the member's registration is still loading. */
  pending: boolean;
  registered: boolean;
  count: number;
  busy: boolean;
  failure: string;
  toggle: () => Promise<void>;
}

/**
 * One registration state per event page: the button at the top and the bar that follows the
 * reader show the same answer, whichever was tapped.
 */
export function useEventRegistration(event: EventSummary | null): EventRegistrationState {
  const { isLoading, isSignedIn, isAdmin } = useSession();
  const member = isSignedIn && !isAdmin;
  const registration = useApi((signal) => (member && event ? api.eventRegistration(event.id, signal) : Promise.resolve(null)), [event?.id, member]);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [delta, setDelta] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const isRegistered = registered ?? Boolean(registration.data?.registered);

  async function toggle() {
    if (!event) return;
    setBusy(true);
    setFailure('');
    try {
      if (isRegistered) {
        await api.cancelEventRegistration(event.id);
        setRegistered(false);
        setDelta((value) => value - 1);
      } else {
        await api.registerForEvent(event.id);
        setRegistered(true);
        setDelta((value) => value + 1);
        track('Inscription à un événement', { événement: event.slug ?? String(event.id) });
      }
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’opération a échoué. Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  return {
    member, isAdmin, pending: isLoading || registration.loading, registered: isRegistered,
    count: (event?.registrationCount ?? 0) + delta, busy, failure, toggle,
  };
}
