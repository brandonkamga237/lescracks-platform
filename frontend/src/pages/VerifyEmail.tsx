// src/pages/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import { ENV } from '@/config/env';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        const json = await res.json();

        if (res.ok && json.success) {
          // Auto-login: store JWT and refresh the auth context
          if (json.data?.token) {
            authService.setToken(json.data.token);
            await refreshUser();
          }
          setStatus('success');
          setMessage(json.message || 'Email confirmé !');
          // Redirect to resources after 2s
          setTimeout(() => navigate('/ressources', { replace: true }), 2000);
        } else {
          setStatus('error');
          setMessage(json.message || 'Lien invalide ou déjà utilisé.');
        }
      } catch {
        setStatus('error');
        setMessage('Une erreur est survenue. Réessaie plus tard.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-display font-bold text-white mb-2">Vérification en cours…</h1>
            <p className="text-white/40 text-sm">Patiente quelques secondes.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">Email confirmé !</h1>
            <p className="text-white/50 mb-2">{message}</p>
            <p className="text-white/30 text-sm">Redirection vers la plateforme…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">Lien invalide</h1>
            <p className="text-white/50 mb-8">{message}</p>
            <Link to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-sm hover:bg-gold/90 transition-colors text-sm">
              Recommencer l'inscription
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
