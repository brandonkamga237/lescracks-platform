import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import authService from '@/services/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        setSent(true);
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
          className="inline-flex items-center gap-2 text-white/40 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-gold mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold mb-3 text-white">Email envoyé !</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Si <span className="text-white/80">{email}</span> est associé à un compte, tu recevras
                un lien de réinitialisation valable <strong className="text-white">30 minutes</strong>.
              </p>
              <p className="text-white/30 text-xs mb-6">
                Vérifie aussi ton dossier spam.
              </p>
              <Link to="/connexion" className="btn-primary py-2.5 px-6 inline-block">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold mb-2 text-white">
                  Mot de passe <span className="text-gold">oublié ?</span>
                </h1>
                <p className="text-white/40 text-sm">
                  Saisis ton adresse email et on t'envoie un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="vous@exemple.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Envoyer le lien'
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

export default ForgotPassword;
