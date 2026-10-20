import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Loader2, Users } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { EventSummary } from '@/services/types';

interface EventRegistrationCardProps {
  event: EventSummary;
  /** False once the event is over: nobody signs up for the past. */
  open: boolean;
}

/** « Je participe »: one tap for a member, a sign-up that brings them back here for a visitor. */
export default function EventRegistrationCard({ event, open }: EventRegistrationCardProps) {
  const { pathname } = useLocation();
  const { isLoading, isSignedIn, isAdmin } = useSession();
  const member = isSignedIn && !isAdmin;
  const registration = useApi((signal) => (member ? api.eventRegistration(event.id, signal) : Promise.resolve(null)), [event.id, member]);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [delta, setDelta] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const isRegistered = registered ?? Boolean(registration.data?.registered);
  const count = event.registrationCount + delta;

  async function toggle() {
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

  return (
    <div className="space-y-3">
      {count > 0 && (
        <p className="flex items-center gap-2 text-sm text-t2">
          <Users className="h-4 w-4 text-gold-ink" aria-hidden />
          {count.toLocaleString('fr-FR')} {count > 1 ? 'participants inscrits' : 'participant inscrit'}
        </p>
      )}
      {open && !isLoading && !isAdmin && (member ? (
        isRegistered ? (
          <div className="rounded border border-gold-400/30 bg-gold-400/5 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-gold-ink"><Check className="h-4 w-4" aria-hidden />Tu participes</p>
            <button type="button" disabled={busy} onClick={() => void toggle()} className="mt-1 text-xs text-t3 underline-offset-4 hover:text-t1 hover:underline disabled:opacity-50">
              {busy ? 'Annulation…' : 'Annuler ma participation'}
            </button>
          </div>
        ) : (
          <button type="button" disabled={busy || registration.loading} onClick={() => void toggle()} className="btn-primary w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}Je participe
          </button>
        )
      ) : (
        <div className="space-y-2">
          <Link to="/inscription" state={{ from: pathname }} className="btn-primary w-full">Je participe</Link>
          <p className="text-center text-xs text-t3">Il faut un compte LesCracks. Déjà membre ? <Link to="/connexion" state={{ from: pathname }} className="link">Se connecter</Link></p>
        </div>
      ))}
      {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
    </div>
  );
}
