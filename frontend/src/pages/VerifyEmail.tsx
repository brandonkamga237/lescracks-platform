import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

export default function VerifyEmail() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const { isSignedIn, refresh } = useSession();
  const [busy, setBusy] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  // A link works once: the second run of a development double effect would report it as used.
  const sent = useRef(false);

  useEffect(() => {
    if (!token) {
      setBusy(false);
      setError('Ce lien est incomplet.');
      return;
    }
    if (sent.current) return;
    sent.current = true;
    api.verifyEmail(token)
      .then(async () => {
        setVerified(true);
        // The banner asking to confirm the address disappears with the fresh session.
        await refresh().catch(() => undefined);
      })
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Impossible de vérifier l’adresse.'))
      .finally(() => setBusy(false));
  }, [token, refresh]);

  return <Layout>
    <SEO title="Vérification d’email" description="Confirme ton adresse email pour recevoir les emails LesCracks." url="/verifier-email" />
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <section className="mode-raised rounded-lg p-6 sm:p-9">
        <p className="kicker">LesCracks / Ton compte</p>
        <h1 className="mt-4 font-display text-3xl font-bold">Confirmation de ton email</h1>
        {busy ? <p className="mt-6 flex items-center gap-3 text-sm text-t3"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Vérification en cours…</p> : verified ? (
          <div role="status" className="mt-6 rounded border border-gold-400/25 p-4 text-sm text-gold-ink">
            Ton adresse email est confirmée. Tu recevras désormais nos emails.
          </div>
        ) : (
          <div role="alert" className="mt-6 rounded border border-error/20 p-4 text-sm text-error-ink">
            {error || 'Ce lien est invalide ou a expiré.'}
            {isSignedIn && <span className="mt-2 block text-t3">Tu peux demander un nouveau lien depuis le bandeau en haut du site.</span>}
          </div>
        )}
        {!busy && (isSignedIn
          ? <Link to="/ressources" replace className="btn-primary mt-7 w-full">Continuer vers les ressources<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          : <Link to="/connexion" replace className="btn-primary mt-7 w-full">Me connecter<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>)}
      </section>
    </div>
  </Layout>;
}
