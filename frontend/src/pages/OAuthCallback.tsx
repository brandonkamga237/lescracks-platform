// src/pages/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, XCircle } from 'lucide-react';

/**
 * Landing page for the OAuth redirect.
 *
 * The backend has already issued the JWT as an HttpOnly cookie, so there is no token
 * in the URL to read — we simply ask the server who we are. If the session is valid,
 * the user is logged in.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const errorParam = new URLSearchParams(window.location.search).get('error');

      if (errorParam) {
        setError('La connexion a échoué. Merci de réessayer ou d\'utiliser ton adresse email.');
        return;
      }

      try {
        // The auth cookie is already set — load the profile it identifies.
        await refreshUser();
        navigate('/ressources', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Impossible de récupérer ton profil. Merci de réessayer dans un instant.');
      }
    };

    handleOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />
        <div className="relative text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">Connexion impossible</h1>
          <p className="text-t3 mb-8">{error}</p>
          <button
            onClick={() => navigate('/connexion', { replace: true })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-sm hover:bg-gold/90 transition-colors text-sm"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
        <p className="text-t2">Connexion en cours…</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
