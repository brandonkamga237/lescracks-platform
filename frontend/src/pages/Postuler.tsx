// src/pages/Postuler.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import Layout from '@/components/layout/Layout';
import {
  Crown,
  CheckCircle,
  Loader2,
  ArrowRight,
  ChevronRight,
  User,
  MessageSquare,
  BarChart3,
} from 'lucide-react';

// ApplicationTypeId as defined in the seeded DB — accompagnement_360 = 4
const ACCOMPAGNEMENT = {
  typeId: 4,
  label: 'Accompagnement 360',
};

const FEATURES = [
  'Bilan de profil approfondi',
  'Plan de progression personnalisé',
  'Séances de coaching régulières avec un mentor',
  'Accès aux ressources et à la communauté LesCracks',
  'Préparation à l\'emploi, au freelance ou à la création',
  'Attestation de complétion',
];

const LEVELS = [
  { value: 'Débutant complet', label: 'Débutant complet — Jamais touché au code' },
  { value: 'Débutant', label: 'Débutant — Quelques notions de base' },
  { value: 'Intermédiaire', label: 'Intermédiaire — Je code mais j\'ai des lacunes' },
  { value: 'Avancé', label: 'Avancé — Je cherche à me spécialiser' },
];

const Postuler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [level, setLevel] = useState('');
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!level) {
      setError('Veuillez sélectionner votre niveau technique.');
      return;
    }
    if (motivation.trim().length < 50) {
      setError('Votre motivation doit faire au moins 50 caractères.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.submitServiceApplication({
        applicationTypeId: ACCOMPAGNEMENT.typeId,
        motivationText: motivation.trim(),
        technicalLevel: level,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Gate — non-authenticated users see a prompt to create account or login
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
              <User className="w-7 h-7 text-gold" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">
              Crée ton compte pour postuler
            </h1>
            <p className="text-white/50 mb-2 leading-relaxed">
              L'<strong className="text-gold">Accompagnement 360</strong> est un parcours certifiant de <strong className="text-white">6 à 12 mois</strong> avec un mentor dédié.
            </p>
            <p className="text-white/35 text-sm mb-8">
              Un compte est nécessaire pour soumettre ta candidature et suivre son avancement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/inscription?redirect=/postuler"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-black font-bold rounded-sm hover:bg-gold/90 transition-colors"
              >
                Créer un compte
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/connexion?redirect=/postuler"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors rounded-sm text-sm"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Candidature reçue !</h1>
            <p className="text-white/60 leading-relaxed mb-2">
              Merci <strong className="text-white">{user?.firstName || user?.username}</strong>. Ta demande d'<strong className="text-gold">Accompagnement 360</strong> a bien été enregistrée.
            </p>
            <p className="text-white/40 text-sm mb-8">
              Notre équipe te contactera sous 48h pour la suite du processus.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/profil" className="btn-secondary">Voir mon profil</Link>
              <Link to="/" className="btn-primary">Retour à l'accueil</Link>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link to="/" className="hover:text-gold transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">Postuler</span>
          </div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <p className="text-[11px] text-gold uppercase tracking-[0.4em] mb-4">Accompagnement 360</p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              Rejoindre <span className="text-gold">LesCracks</span>
            </h1>
            <p className="text-white/50 text-lg max-w-xl">
              Un suivi humain et structuré pour passer de débutant à profil employable dans la tech.
            </p>
          </motion.div>

          {/* What you get */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-gold/20 bg-gold/3 p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center">
                <Crown className="w-4 h-4 text-gold" />
              </div>
              <p className="font-display font-semibold text-white">Ce que tu obtiens</p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle className="w-4 h-4 text-gold/60 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="card p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg">Ta candidature</h2>
                <p className="text-white/40 text-sm">pour l'<span className="text-gold">Accompagnement 360</span></p>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-3">
                <BarChart3 className="w-4 h-4 text-gold" />
                Ton niveau technique actuel <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {LEVELS.map((l) => (
                  <label
                    key={l.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      level === l.value
                        ? 'border-gold/50 bg-gold/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={l.value}
                      checked={level === l.value}
                      onChange={() => setLevel(l.value)}
                      className="accent-gold"
                    />
                    <span className="text-sm text-white/80">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <MessageSquare className="w-4 h-4 text-gold" />
                Ta motivation <span className="text-red-400">*</span>
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold resize-none text-sm"
                placeholder="Où en es-tu ? Quel est ton objectif concret ? Pourquoi tu veux rejoindre LesCracks ? (min. 50 caractères)"
                required
              />
              <p className={`text-xs mt-1 ${motivation.length >= 50 ? 'text-green-400' : 'text-white/30'}`}>
                {motivation.length}/50 caractères minimum
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Envoyer ma candidature
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-white/20 text-xs">
              Notre équipe te contactera sous 48h par email ou WhatsApp.
            </p>
          </motion.form>

        </div>
      </div>
    </Layout>
  );
};

export default Postuler;
