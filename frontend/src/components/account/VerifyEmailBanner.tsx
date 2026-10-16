import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MailCheck, X } from 'lucide-react';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

const DISMISSED = 'lescracks.verify.dismissed';
const QUIET_PATHS = ['/bienvenue', '/verifier-email', '/connexion', '/inscription'];

function dismissedThisVisit() {
  try { return sessionStorage.getItem(DISMISSED) === '1'; } catch { return false; }
}

/**
 * Asks a member to confirm their address without standing in their way: everything works
 * meanwhile. Closing it hides it for the rest of the visit; it comes back on the next one.
 */
export default function VerifyEmailBanner() {
  const { pathname } = useLocation();
  const { isSignedIn, isAdmin, user } = useSession();
  const [hidden, setHidden] = useState(dismissedThisVisit);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [failure, setFailure] = useState('');

  if (!isSignedIn || isAdmin || !user || user.verified || hidden || QUIET_PATHS.some((path) => pathname.startsWith(path))) return null;

  async function resend() {
    setState('sending');
    setFailure('');
    try {
      await api.resendMyVerification();
      setState('sent');
    } catch (cause) {
      setState('idle');
      setFailure(cause instanceof ApiError ? cause.message : 'L’envoi a échoué. Réessaie dans un instant.');
    }
  }

  function close() {
    try { sessionStorage.setItem(DISMISSED, '1'); } catch { /* storage blocked: hidden until the next page only */ }
    setHidden(true);
  }

  return (
    <div role="status" className="border-b border-gold-400/25 bg-gold-400/5 px-4 py-2.5 text-sm text-t2">
      <div className="mx-auto flex max-w-7xl items-start gap-3 sm:items-center">
        <MailCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink sm:mt-0" />
        <p className="min-w-0 flex-1">
          {state === 'sent'
            ? <>Lien envoyé à <span className="font-medium text-t1">{user.email}</span>. Pense à regarder dans les indésirables.</>
            : <>Confirme ton adresse <span className="break-all font-medium text-t1">{user.email}</span> pour recevoir nos emails.{' '}
              <button type="button" disabled={state === 'sending'} onClick={() => void resend()}
                className="font-medium text-gold-ink underline underline-offset-4 hover:text-t1 disabled:opacity-60">
                {state === 'sending' ? 'Envoi…' : 'Renvoyer le lien'}
              </button></>}
          {failure && <span className="mt-1 block text-error-ink">{failure}</span>}
        </p>
        <button type="button" onClick={close} aria-label="Masquer ce message"
          className="-m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-t4 transition-colors hover:text-t1">
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
