// src/pages/ApprennantProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Linkedin, Globe, Mail, Award, BookOpen, Clock, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/common/SEO';
import apiService, { Learner, LearnerStatus } from '@/services/api';

const STATUS_CONFIG: Record<LearnerStatus, { label: string; icon: React.ElementType; color: string; bg: string; accent: string }> = {
  EN_COURS: {
    label: 'En cours de parcours',
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    accent: 'from-blue-500/10',
  },
  TERMINE_AVEC_CERTIFICAT: {
    label: 'Certifié LesCracks',
    icon: Award,
    color: 'text-gold',
    bg: 'bg-gold/10 border-gold/20',
    accent: 'from-gold/10',
  },
  TERMINE_SANS_CERTIFICAT: {
    label: 'Diplômé LesCracks',
    icon: BookOpen,
    color: 'text-white/70',
    bg: 'bg-white/5 border-white/10',
    accent: 'from-white/5',
  },
};

export default function ApprennantProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiService.getLearnerBySlug(slug)
      .then(setLearner)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !learner) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
          <p className="text-5xl mb-4">🤷</p>
          <h1 className="text-2xl font-bold text-white mb-2">Profil introuvable</h1>
          <p className="text-white/40 mb-8">Cet apprenant n'existe pas ou n'est plus visible.</p>
          <Link to="/apprenants" className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voir tous les apprenants
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const status = STATUS_CONFIG[learner.status];
  const StatusIcon = status.icon;
  const isCertified = learner.status === 'TERMINE_AVEC_CERTIFICAT';
  const seoDescription = learner.bio
    ? `${learner.fullName} — ${status.label}${learner.cohort ? ` · Cohorte ${learner.cohort}` : ''}. ${learner.bio.slice(0, 120)}...`
    : `${learner.fullName} — ${status.label} de l'Accompagnement 360 LesCracks${learner.cohort ? ` · Cohorte ${learner.cohort}` : ''}.`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={`${learner.fullName} — Apprenant LesCracks`}
        description={seoDescription}
        url={`/apprenants/${learner.slug}`}
      />
      <Header />

      {/* Hero banner */}
      <div className={`relative pt-24 pb-0 overflow-hidden bg-gradient-to-br ${status.accent} to-transparent`}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-background" />

        <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-10">
          <Link
            to="/apprenants"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les apprenants
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            {learner.photoUrl ? (
              <img
                src={learner.photoUrl}
                alt={learner.fullName}
                className={`w-24 h-24 rounded-2xl object-cover border-2 flex-shrink-0 ${isCertified ? 'border-gold/40' : 'border-white/15'}`}
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 ${
                isCertified ? 'bg-gold/15 border border-gold/30 text-gold' : 'bg-white/8 border border-white/15 text-white/60'
              }`}>
                {learner.firstName[0]}{learner.lastName[0]}
              </div>
            )}

            <div>
              {learner.cohort && (
                <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Cohorte {learner.cohort}</p>
              )}
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{learner.fullName}</h1>

              <div className={`inline-flex items-center gap-2 mt-3 text-sm px-4 py-1.5 rounded-full border font-medium ${status.bg} ${status.color}`}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="md:col-span-2 space-y-6">

            {/* Bio */}
            {learner.bio && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">À propos</h2>
                <p className="text-white/70 leading-relaxed text-sm">{learner.bio}</p>
              </motion.div>
            )}

            {/* Liens */}
            {(learner.linkedinUrl || learner.portfolioUrl || learner.email) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">
                  Retrouver {learner.firstName}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {learner.linkedinUrl && (
                    <a href={learner.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {learner.portfolioUrl && (
                    <a href={learner.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                      <Globe className="w-4 h-4" /> Portfolio
                    </a>
                  )}
                  {learner.email && (
                    <a href={`mailto:${learner.email}`}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Badge certifié */}
            {isCertified && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/25 rounded-2xl p-5 text-center">
                <Award className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-gold font-bold text-sm">Certifié LesCracks</p>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  A complété l'Accompagnement 360 avec succès
                </p>
              </motion.div>
            )}

            {/* CTA rejoindre */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Tu veux toi aussi devenir un crack de la tech ?
              </p>
              <Link to="/postuler"
                className="flex items-center justify-center gap-2 bg-gold text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-gold/80 transition-colors text-sm w-full">
                Postuler <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
