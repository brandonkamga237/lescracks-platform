// src/pages/Postuler.tsx
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import Layout from '@/components/layout/Layout';
import {
  Crown,
  BookOpen,
  CheckCircle,
  Loader2,
  ArrowRight,
  ChevronRight,
  User,
  MessageSquare,
  BarChart3,
} from 'lucide-react';

// ApplicationTypeId as defined in the seeded DB
// accompagnement_360 = 4, formation_classique = 5  (adjust to your seed values)
const SERVICE_TYPES = [
  {
    id: 'accompagnement_360',
    typeId: 4,
    label: 'Accompagnement 360',
    tagline: 'Transformation complète · Résultat garanti',
    badge: 'RECOMMANDÉ',
    icon: Crown,
    color: 'gold',
    description:
      'Un suivi personnalisé de A à Z : bilan initial, plan sur-mesure, coaching hebdomadaire et accompagnement jusqu\'à l\'insertion professionnelle (emploi, freelance ou projet).',
    forWho: 'Débutants, reconversions, profils bloqués depuis + de 6 mois.',
    result: 'Emploi · Freelance · Projet concret en 6 mois',
  },
  {
    id: 'formation_classique',
    typeId: 5,
    label: 'Formation pratique',
    tagline: 'Compétences ciblées · À ton rythme',
    badge: null,
    icon: BookOpen,
    color: 'white',
    description:
      'Cours structurés, projets guidés et exercices pratiques pour acquérir des compétences tech spécifiques. Sans accompagnement profond ni garantie d\'insertion.',
    forWho: 'Ceux qui savent ce qu\'ils veulent apprendre et qui avancent seuls.',
    result: 'Compétences certifiées · Portfolio de projets',
  },
];

const LEVELS = [
  { value: 'Débutant complet', label: 'Débutant complet — Jamais touché au code' },
  { value: 'Débutant', label: 'Débutant — Quelques notions de base' },
  { value: 'Intermédiaire', label: 'Intermédiaire — Je code mais j\'ai des lacunes' },
  { value: 'Avancé', label: 'Avancé — Je cherche à me spécialiser' },
];

const Postuler = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultService = searchParams.get('service') === 'formation' ? 'formation_classique' : 'accompagnement_360';

  const [selectedService, setSelectedService] = useState(defaultService);
  const [level, setLevel] = useState('');
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return <Navigate to={`/inscription?redirect=/postuler${searchParams.get('service') ? `?service=${searchParams.get('service')}` : ''}`} replace />;
  }

  const selected = SERVICE_TYPES.find((s) => s.id === selectedService)!;

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
        applicationTypeId: selected.typeId,
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
            <h1 className="text-2xl font-display font-bold mb-3">
              Candidature reçue !
            </h1>
            <p className="text-white/60 leading-relaxed mb-2">
              Merci <strong className="text-white">{user?.firstName || user?.username}</strong>. Votre demande d'<strong className="text-gold">{selected.label}</strong> a bien été enregistrée.
            </p>
            <p className="text-white/40 text-sm mb-8">
              Notre équipe vous contactera sous 48h pour la suite du processus.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/profil" className="btn-secondary">
                Voir mon profil
              </Link>
              <Link to="/" className="btn-primary">
                Retour à l'accueil
              </Link>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              Choisissez votre <span className="text-gold">parcours</span>
            </h1>
            <p className="text-white/50 text-lg">
              Sélectionnez l'offre qui correspond à votre situation, puis complétez votre candidature.
            </p>
          </motion.div>

          {/* Service selector */}
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {SERVICE_TYPES.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedService === service.id;
              return (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedService(service.id)}
                  className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? service.color === 'gold'
                        ? 'border-gold bg-gold/10'
                        : 'border-white/40 bg-white/5'
                      : 'border-white/10 bg-white/2 hover:border-white/20'
                  }`}
                >
                  {service.badge && (
                    <span className="absolute -top-3 left-4 px-3 py-0.5 bg-gold text-black text-xs font-bold rounded-full">
                      {service.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    service.color === 'gold' ? 'bg-gold/20' : 'bg-white/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${service.color === 'gold' ? 'text-gold' : 'text-white/60'}`} />
                  </div>
                  <h3 className={`font-display font-bold text-lg mb-1 ${service.color === 'gold' ? 'text-gold' : 'text-white'}`}>
                    {service.label}
                  </h3>
                  <p className="text-xs text-white/40 mb-3">{service.tagline}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{service.description}</p>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/30 mb-1">Résultat attendu</p>
                    <p className={`text-sm font-medium ${service.color === 'gold' ? 'text-gold' : 'text-white/70'}`}>
                      {service.result}
                    </p>
                  </div>
                  {isSelected && (
                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center ${
                      service.color === 'gold' ? 'bg-gold' : 'bg-white'
                    }`}>
                      <CheckCircle className="w-5 h-5 text-black" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Application form */}
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
                <h2 className="font-display font-semibold text-lg">Votre candidature</h2>
                <p className="text-white/40 text-sm">pour l'offre <span className="text-gold">{selected.label}</span></p>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-3">
                <BarChart3 className="w-4 h-4 text-gold" />
                Votre niveau technique actuel <span className="text-red-400">*</span>
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
                Votre motivation <span className="text-red-400">*</span>
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold resize-none text-sm"
                placeholder={`Dites-nous pourquoi vous souhaitez rejoindre le programme ${selected.label}. Où en êtes-vous ? Quel est votre objectif concret ? (min. 50 caractères)`}
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
              Notre équipe vous contactera sous 48h par email ou WhatsApp.
            </p>
          </motion.form>
        </div>
      </div>
    </Layout>
  );
};

export default Postuler;
