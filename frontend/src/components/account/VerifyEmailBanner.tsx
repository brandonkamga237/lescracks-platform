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

  // One line on a phone: the address is already known to the member, the action is what matters.
  return (
    <div role="status" className="border-b border-gold-400/20 bg-gold-400/[0.06] px-4 py-2 text-sm text-white/70 sm:px-8">
      <div className="flex items-center gap-3">
        <MailCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-400" />
        <p className="min-w-0 flex-1 truncate">
          {state === 'sent'
            ? <>Lien envoyé. <span className="hidden sm:inline">Pense à regarder dans les indésirables.</span></>
            : <>Confirme ton email<span className="hidden sm:inline"> <span className="font-medium text-white">{user.email}</span> pour recevoir nos emails</span>.</>}
          {failure && <span className="ml-2 text-error-ink">{failure}</span>}
        </p>
        {state !== 'sent' && (
          <button type="button" disabled={state === 'sending'} onClick={() => void resend()}
            className="shrink-0 rounded-full bg-gold-400/15 px-3 py-1 text-xs font-medium text-gold-400 transition-colors hover:bg-gold-400/25 active:scale-95 disabled:opacity-60 motion-reduce:active:scale-100">
            {state === 'sending' ? 'Envoi…' : 'Renvoyer'}
          </button>
        )}
        <button type="button" onClick={close} aria-label="Masquer ce message"
          className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white">
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
