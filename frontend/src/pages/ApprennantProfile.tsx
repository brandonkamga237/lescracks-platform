// src/pages/ApprennantProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Linkedin, Globe, Mail, Award, BookOpen, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import apiService, { Learner, LearnerStatus } from '@/services/api';

const STATUS_CONFIG: Record<LearnerStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  EN_COURS: { label: 'En cours de parcours', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  TERMINE_AVEC_CERTIFICAT: { label: 'Certifié LesCracks', icon: Award, color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
  TERMINE_SANS_CERTIFICAT: { label: 'Diplômé LesCracks', icon: BookOpen, color: 'text-white/70', bg: 'bg-white/5 border-white/10' },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Back */}
          <Link
            to="/apprenants"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les apprenants
          </Link>

          {/* Card principale */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">

            {/* Header card */}
            <div className="bg-gradient-to-br from-gold/5 to-transparent p-8 pb-6 border-b border-white/10">
              <div className="flex items-start gap-5">
                {learner.photoUrl ? (
                  <img
                    src={learner.photoUrl}
                    alt={learner.fullName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-2xl font-bold flex-shrink-0">
                    {learner.firstName[0]}{learner.lastName[0]}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{learner.fullName}</h1>
                  {learner.cohort && (
                    <p className="text-sm text-white/40 mt-0.5">Cohorte {learner.cohort}</p>
                  )}
                  <div className={`inline-flex items-center gap-1.5 mt-3 text-xs px-3 py-1 rounded-full border font-medium ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {learner.bio && (
              <div className="p-8 border-b border-white/10">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">À propos</h2>
                <p className="text-white/70 leading-relaxed">{learner.bio}</p>
              </div>
            )}

            {/* Liens */}
            {(learner.linkedinUrl || learner.portfolioUrl || learner.email) && (
              <div className="p-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Retrouver {learner.firstName}</h2>
                <div className="flex flex-wrap gap-3">
                  {learner.linkedinUrl && (
                    <a
                      href={learner.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors px-4 py-2 rounded-xl text-sm font-medium"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  {learner.portfolioUrl && (
                    <a
                      href={learner.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors px-4 py-2 rounded-xl text-sm font-medium"
                    >
                      <Globe className="w-4 h-4" />
                      Portfolio
                    </a>
                  )}
                  {learner.email && (
                    <a
                      href={`mailto:${learner.email}`}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors px-4 py-2 rounded-xl text-sm font-medium"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA rejoindre */}
          <div className="mt-8 p-6 bg-gold/5 border border-gold/10 rounded-2xl text-center">
            <p className="text-white/60 text-sm mb-3">Tu veux toi aussi devenir un crack de la tech ?</p>
            <Link
              to="/postuler"
              className="inline-block bg-gold text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-gold/80 transition-colors text-sm"
            >
              Rejoindre l'Accompagnement 360
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
