import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import PasswordInput from '@/components/common/PasswordInput';
import authService from '@/services/auth';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien invalide. Demande un nouveau lien de réinitialisation.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.resetPassword(token, newPassword);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/connexion', { replace: true }), 3000);
      } else {
        setError(result.message || 'Une erreur est survenue');
      }
    } catch {
      setError('Une erreur est survenue. Réessaie plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/connexion"
          className="inline-flex items-center gap-2 text-t3 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        <div className="card p-8">
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-gold mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold mb-3 text-white">
                Mot de passe mis à jour !
              </h1>
              <p className="text-t3 text-sm mb-6">
                Tu vas être redirigé vers la connexion dans quelques secondes…
              </p>
              <Link to="/connexion" className="btn-primary py-2.5 px-6 inline-block">
                Se connecter
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold mb-3 text-white">Lien invalide</h1>
              <p className="text-t3 text-sm mb-6">
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
              <Link to="/mot-de-passe-oublie" className="btn-primary py-2.5 px-6 inline-block">
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold mb-2 text-white">
                  Nouveau <span className="text-gold">mot de passe</span>
                </h1>
                <p className="text-t3 text-sm">
                  Choisis un mot de passe d'au moins 8 caractères.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <PasswordInput
                  label="Nouveau mot de passe"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  hint="Au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial."
                />

                <PasswordInput
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
