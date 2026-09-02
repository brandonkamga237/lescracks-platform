import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

/**
 * Where Keycloak sends the reader back.
 *
 * react-oidc-context does the exchange itself; this only waits for it and puts the person
 * back where they were, which is the part they care about.
 */
export default function AuthCallback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;

    const from = (auth.user?.state as { from?: string } | undefined)?.from;
    navigate(auth.error ? '/' : (from ?? '/ressources'), { replace: true });
  }, [auth.isLoading, auth.error, auth.user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        <p className="mt-6 text-t3">
          {auth.error ? 'La connexion a échoué. Redirection…' : 'Connexion en cours…'}
        </p>
      </div>
    </div>
  );
}
