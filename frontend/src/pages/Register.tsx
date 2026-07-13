// src/pages/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/common/SEO';
import { ArrowLeft, Mail, User, Github, Loader2, CheckCircle } from 'lucide-react';
import PasswordInput from '@/components/common/PasswordInput';

const Register = () => {
  const { register, loginWithGitHub, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      if (response.success) {
        setEmailSent(true);
      } else {
        setError(response.message || 'L\'inscription a échoué. Merci de réessayer.');
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue. Merci de réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    if (provider === 'google') {
      navigate(`/provider-unavailable?provider=google&from=/inscription`);
    } else {
      loginWithGitHub();
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">Vérifie ta boîte mail</h1>
          <p className="text-t3 mb-2">
            Un email de confirmation a été envoyé à <strong className="text-white">{formData.email}</strong>.
          </p>
          <p className="text-t3 text-sm mb-8">
            Clique sur le lien dans l'email pour activer ton compte. Vérifie aussi tes spams.
          </p>
          <Link to="/connexion" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors text-sm">
            Retour à la connexion
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
      <SEO title="Créer un compte" description="Rejoins la communauté LesCracks — crée ton compte gratuitement et accède aux ressources tech." url="/inscription" />
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-t3 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold mb-2">
              Rejoignez <span className="text-gold">LesCracks</span>
            </h1>
            <p className="text-t3">
              Commencez votre transformation professionnelle
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              S'inscrire avec Google
            </button>

            <button
              onClick={() => handleOAuth('github')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/10 border border-line text-white font-medium hover:bg-white/20 transition-colors"
            >
              <Github className="w-5 h-5" />
              S'inscrire avec GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-t3">ou</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-t2 mb-2">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-t4" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-t2 mb-2">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-t2 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-t4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
            </div>

            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              hint="Au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial."
            />

            <PasswordInput
              name="confirmPassword"
              label="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full btn-primary py-3"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-t3">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-gold hover:text-gold-light">
              Se connecter
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
