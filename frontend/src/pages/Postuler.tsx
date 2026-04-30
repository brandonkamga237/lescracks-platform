// src/pages/Postuler.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/common/SEO';
import { motion } from 'framer-motion';
import { apiService } from '@/services/api';
import Layout from '@/components/layout/Layout';
import {
  Crown,
  CheckCircle,
  Loader2,
  ArrowRight,
  ChevronRight,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
} from 'lucide-react';

const ACCOMPAGNEMENT_TYPE_ID = 4;

const FEATURES = [
  'Bilan de profil approfondi',
  'Plan de progression personnalisé',
  'Séances de coaching régulières avec un mentor',
  'Accès aux ressources et à la communauté LesCracks',
  'Préparation à l\'emploi, au freelance ou à la création',
  'Attestation de complétion',
];

const Postuler = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [motivation, setMotivation] = useState('');
  const [age, setAge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Le nom complet est requis.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }
    if (!whatsapp.trim()) {
      setError('Le numéro WhatsApp est requis.');
      return;
    }
    if (motivation.trim().length < 50) {
      setError('Votre motivation doit faire au moins 50 caractères.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.submitServiceApplication({
        applicationTypeId: ACCOMPAGNEMENT_TYPE_ID,
        fullName: fullName.trim(),
        emailAddress: email.trim(),
        whatsappNumber: whatsapp.trim(),
        motivationText: motivation.trim(),
        age: age ? parseInt(age, 10) : undefined,
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
            <h1 className="text-2xl font-display font-bold mb-3">Candidature reçue !</h1>
            <p className="text-white/60 leading-relaxed mb-2">
              Merci <strong className="text-white">{fullName}</strong>. Ta demande d'<strong className="text-gold">Accompagnement 360</strong> a bien été enregistrée.
            </p>
            <p className="text-white/40 text-sm mb-2">
              Un email de confirmation a été envoyé à <strong className="text-white/60">{email}</strong>.
            </p>
            <p className="text-white/40 text-sm mb-8">
              Notre équipe te contactera prochainement sur WhatsApp au <strong className="text-white/60">{whatsapp}</strong>.
            </p>
            <Link to="/" className="btn-primary">Retour à l'accueil</Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Postuler à l'Accompagnement 360"
        description="Rejoins l'Accompagnement 360 de LesCracks — suivi personnalisé de 6 à 12 mois avec mentor dédié, projets réels et attestation. Postule maintenant."
        url="/postuler"
      />
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

            {/* Nom complet */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <User className="w-4 h-4 text-gold" />
                Nom complet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold text-sm"
                placeholder="Jean Dupont"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <Mail className="w-4 h-4 text-gold" />
                Adresse email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold text-sm"
                placeholder="jean@example.com"
                required
              />
            </div>

            {/* WhatsApp + Âge en ligne */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <Phone className="w-4 h-4 text-gold" />
                  Numéro WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold text-sm"
                  placeholder="+237 6XX XXX XXX"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  Âge <span className="text-white/30 text-xs">(optionnel)</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={12}
                  max={99}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold text-sm"
                  placeholder="ex : 22"
                />
              </div>
            </div>

            {/* Motivation */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <MessageSquare className="w-4 h-4 text-gold" />
                Motivation / présentation <span className="text-red-400">*</span>
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
              Notre équipe te contactera prochainement sur WhatsApp.
            </p>
          </motion.form>

        </div>
      </div>
    </Layout>
  );
};

export default Postuler;
