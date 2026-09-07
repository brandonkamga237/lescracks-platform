import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import { safeReturnPath } from '@/services/auth';
import { useSession } from '@/hooks/useSession';

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
  const from = safeReturnPath((auth.user?.state as { from?: string } | undefined)?.from, isAdmin ? '/admin' : '/profil');
  const waiting = auth.isLoading || isLoading;
  const failed = !waiting && (auth.error || error || !isSignedIn);

  useEffect(() => {
    if (waiting || auth.error || error || !isSignedIn) return;
    navigate(from, { replace: true });
  }, [waiting, auth.error, error, isSignedIn, from, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-white">
      <div className="max-w-md rounded-3xl border border-white/10 bg-[#171717] p-8 text-center">
        {failed ? <>
          <h1 className="font-display text-2xl font-semibold">La connexion n’a pas abouti</h1>
          <p role="alert" className="mt-4 text-sm leading-relaxed text-zinc-300">{error?.message ?? 'La connexion sécurisée a été interrompue ou a expiré. Tu peux réessayer sans perdre ta destination.'}</p>
          {error && <button type="button" onClick={() => void reload().catch(() => undefined)} className="mt-6 w-full rounded-xl border border-[#d4af37]/40 px-5 py-3 text-[#d4af37]">Réessayer la vérification</button>}
          <Link to={`/connexion?retour=${encodeURIComponent(from)}`} replace className="mt-4 block rounded-xl bg-[#d4af37] px-5 py-3 font-semibold text-black">Revenir à la connexion</Link>
          <Link to="/ressources" className="mt-5 block text-sm text-zinc-400 underline">Explorer les ressources</Link>
        </> : <div role="status">
          <div aria-hidden="true" className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent motion-reduce:animate-none" />
          <h1 className="mt-6 font-display text-2xl">On prépare ton espace.</h1>
          <p className="mt-3 text-sm text-zinc-400">Vérification de ta connexion en cours…</p>
        </div>}
      </div>
    </div>
  );
}
