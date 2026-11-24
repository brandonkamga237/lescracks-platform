import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import AuthCard from '@/components/site/AuthCard';
import AuthShell from '@/components/site/AuthShell';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/field';
import { useSession } from '@/hooks/useSession';
import { safeReturnPath } from '@/services/auth';

/**
 * Where Keycloak sends the reader back.
 *
 * react-oidc-context does the exchange itself; this only waits for it and puts the person
 * back where they were, which is the part they care about.
 */
export default function AuthCallback() {
  const auth = useAuth();
  const { isLoading, isSignedIn, isAdmin, error, reload } = useSession();
  const navigate = useNavigate();
  const from = safeReturnPath((auth.user?.state as { from?: string } | undefined)?.from, isAdmin ? '/admin' : '/');
  const waiting = auth.isLoading || isLoading;
  const failed = !waiting && (auth.error || error || !isSignedIn);

  useEffect(() => {
    if (waiting || auth.error || error || !isSignedIn) return;
    navigate(from, { replace: true });
  }, [waiting, auth.error, error, isSignedIn, from, navigate]);

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        {failed ? (
          <AuthCard eyebrow="Connexion" title="La connexion n’a pas abouti." lead="La connexion sécurisée a été interrompue ou a expiré. Tu peux réessayer sans perdre ta destination.">
            {error && <Notice tone="error" className="mt-6">{error.message}</Notice>}
            {error && <Button type="button" size="lg" variant="outline" onClick={() => void reload().catch(() => undefined)} className="mt-6 w-full">Réessayer la vérification</Button>}
            <Button asChild size="lg" className="mt-3 w-full font-semibold"><Link to={`/connexion?retour=${encodeURIComponent(from)}`} replace>Revenir à la connexion</Link></Button>
          </AuthCard>
        ) : (
          <div role="status" className="text-center">
            <div aria-hidden="true" className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold-400 border-t-transparent motion-reduce:animate-none" />
            <p className="mt-6 text-2xl font-semibold tracking-tight">On prépare ton espace.</p>
            <p className="mt-2 text-sm text-white/55">Vérification de ta connexion en cours…</p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
