// src/pages/MonProfilApprenant.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Linkedin, Globe, Save, ExternalLink,
  Award, Clock, BookOpen, User, CheckCircle,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import apiService, { Learner, LearnerStatus } from '@/services/api';

const STATUS_CONFIG: Record<LearnerStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  EN_COURS:                { label: 'En cours de parcours',  icon: Clock,    color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  TERMINE_AVEC_CERTIFICAT: { label: 'Certifié LesCracks',    icon: Award,    color: 'text-gold',     bg: 'bg-gold/10 border-gold/20' },
  TERMINE_SANS_CERTIFICAT: { label: 'Diplômé LesCracks',     icon: BookOpen, color: 'text-white/70', bg: 'bg-white/5 border-white/10' },
};

export default function MonProfilApprenant() {
  const [learner, setLearner]     = useState<Learner | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [noProfile, setNoProfile] = useState(false);

  const [bio, setBio]                 = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  useEffect(() => {
    apiService.getMyLearnerProfile()
      .then((data) => {
        setLearner(data);
        setBio(data.bio || '');
        setLinkedinUrl(data.linkedinUrl || '');
        setPortfolioUrl(data.portfolioUrl || '');
      })
      .catch(() => setNoProfile(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!learner) return;
    setSaving(true);
    try {
      const updated = await apiService.updateMyLearnerProfile({ bio, linkedinUrl, portfolioUrl });
      setLearner(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (noProfile) {
    return (
      <Layout>
        <SEO title="Mon profil apprenant" url="/mon-profil-apprenant" />
        <div className="max-w-xl mx-auto px-4 py-32 text-center">
          <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Pas encore de profil apprenant</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Tu n'as pas encore de profil apprenant sur LesCracks.<br />
            Ton profil est créé par l'équipe une fois que tu rejoins l'Accompagnement 360.
          </p>
          <Link to="/postuler"
            className="inline-flex items-center gap-2 bg-gold text-black font-semibold px-6 py-3 rounded-xl hover:bg-gold/80 transition-colors">
            Postuler à l'Accompagnement 360
          </Link>
        </div>
      </Layout>
    );
  }

  if (!learner) return null;

  const status = STATUS_CONFIG[learner.status];
  const StatusIcon = status.icon;
  const hasChanges =
    bio !== (learner.bio || '') ||
    linkedinUrl !== (learner.linkedinUrl || '') ||
    portfolioUrl !== (learner.portfolioUrl || '');

  return (
    <Layout>
      <SEO title="Mon profil apprenant" url="/mon-profil-apprenant" />

      <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mb-10">
          <p className="text-[11px] text-gold uppercase tracking-[0.4em] mb-3">Apprenant LesCracks</p>
          <h1 className="text-3xl font-display font-bold text-white">Mon profil public</h1>
          <p className="text-white/40 text-sm mt-2">
            Ces informations sont visibles par tous sur{' '}
            <Link to={`/apprenants/${learner.slug}`} className="text-gold hover:underline">
              ta page publique
            </Link>.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">

          {/* LEFT — preview carte */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }} className="md:col-span-2">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Aperçu de ta carte</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-gold/20 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                {learner.photoUrl ? (
                  <img src={learner.photoUrl} alt={learner.fullName}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white/10 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-xl font-bold flex-shrink-0">
                    {learner.firstName[0]}{learner.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{learner.fullName}</p>
                  {learner.cohort && <p className="text-xs text-white/40 mt-0.5">Cohorte {learner.cohort}</p>}
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-2 font-medium ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
              </div>
              {bio && <p className="text-xs text-white/50 line-clamp-3 mb-3">{bio}</p>}
              <div className="flex gap-3">
                {linkedinUrl && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-400">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </span>
                )}
                {portfolioUrl && (
                  <span className="flex items-center gap-1.5 text-xs text-gold">
                    <Globe className="w-3.5 h-3.5" /> Portfolio
                  </span>
                )}
              </div>
            </div>

            <Link to={`/apprenants/${learner.slug}`}
              className="mt-3 flex items-center gap-2 text-xs text-white/40 hover:text-gold transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Voir mon profil public
            </Link>
          </motion.div>

          {/* RIGHT — formulaire */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }} className="md:col-span-3 space-y-5">

            {/* Bio */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">
                À propos de toi
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Décris ton parcours, tes compétences, tes ambitions..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 resize-none leading-relaxed"
              />
              <p className="text-xs text-white/25 mt-1 text-right">{bio.length}/500</p>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">
                URL LinkedIn
              </label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/ton-profil"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
                />
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">
                URL Portfolio / GitHub
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://ton-portfolio.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
                />
              </div>
            </div>

            {/* Infos non modifiables */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/6">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Informations du programme</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/25 text-xs mb-0.5">Statut</p>
                  <p className={`font-medium text-sm ${status.color}`}>{status.label}</p>
                </div>
                {learner.cohort && (
                  <div>
                    <p className="text-white/25 text-xs mb-0.5">Cohorte</p>
                    <p className="text-white/70 font-medium">{learner.cohort}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/20 mt-3">Ces informations sont gérées par l'équipe LesCracks.</p>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 bg-gold text-black font-semibold px-6 py-3 rounded-xl hover:bg-gold/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saved ? 'Sauvegardé !' : 'Enregistrer'}
              </button>
              {!hasChanges && !saved && (
                <p className="text-xs text-white/25">Aucune modification</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
