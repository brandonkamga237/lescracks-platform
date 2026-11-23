import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';

import SEO from '@/components/common/SEO';
import AuthCard from '@/components/site/AuthCard';
import AuthShell from '@/components/site/AuthShell';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/field';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

export default function VerifyEmail() {
  const token = new URLSearchParams(useLocation().search).get('token');
  const { isSignedIn, refresh } = useSession();
  const [busy, setBusy] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(token ? '' : 'Ce lien est incomplet.');
  // A link works once: the second run of a development double effect would report it as used.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
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

  return (
    <AuthShell>
      <SEO title="Vérification d’email" description="Confirme ton adresse email pour recevoir les emails LesCracks." url="/verifier-email" />
      <div className="w-full max-w-md">
        <AuthCard eyebrow="Ton compte" title={verified ? 'Adresse confirmée.' : 'Confirmation de ton email.'} lead="Une adresse confirmée, c’est la garantie de recevoir tes attestations et les rappels de tes rendez-vous.">
          {busy && <p role="status" className="mt-7 flex items-center gap-3 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Vérification en cours…</p>}
          {!busy && verified && <Notice tone="info" className="mt-7">Ton adresse email est confirmée. Tu recevras désormais nos emails.</Notice>}
          {!busy && !verified && (
            <Notice tone="error" className="mt-7">
              {error || 'Ce lien est invalide ou a expiré.'}
              {isSignedIn && <span className="mt-2 block text-white/55">Tu peux demander un nouveau lien depuis le bandeau en haut de ton espace.</span>}
            </Notice>
          )}
          {!busy && (
            <Button asChild size="lg" className="mt-8 w-full font-semibold">
              {isSignedIn
                ? <Link to="/" replace>Aller à mon dashboard<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                : <Link to="/connexion" replace>Me connecter<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </Button>
          )}
        </AuthCard>
      </div>
    </AuthShell>
  );
}
