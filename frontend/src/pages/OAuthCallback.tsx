// src/pages/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, XCircle } from 'lucide-react';

/**
 * Reads a value from either the URL fragment (#token=...) or the query string
 * (?token=...). The backend redirects with the token in the fragment so it is
 * never sent to the server or logged, but we also accept the query string for
 * backward compatibility.
 */
const readCallbackParam = (key: string): string | null => {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.substring(1)
    : window.location.hash;
  const fromHash = new URLSearchParams(hash).get(key);
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get(key);
};

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = readCallbackParam('token');
      const errorParam = readCallbackParam('error');

      // Remove the token from the address bar and browser history immediately.
      window.history.replaceState(null, '', window.location.pathname);

      if (errorParam) {
        setError('La connexion a échoué. Merci de réessayer ou d\'utiliser ton adresse email.');
        return;
      }

      if (!token) {
        setError('La connexion n\'a pas pu être finalisée. Merci de réessayer.');
        return;
      }

      try {
        authService.setToken(token);

        // Load the user and update the auth context so isAuthenticated becomes true.
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
          <p className="text-white/50 mb-8">{error}</p>
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
        <p className="text-white/60">Connexion en cours…</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
