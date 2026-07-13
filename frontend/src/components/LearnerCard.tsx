import { Link } from 'react-router-dom';
import { Linkedin, Globe, Award, Clock, BookOpen, ArrowRight } from 'lucide-react';
import type { Learner, LearnerStatus } from '@/services/api';

const STATUS_CONFIG: Record<LearnerStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  EN_COURS: {
    label: 'En parcours',
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  TERMINE_AVEC_CERTIFICAT: {
    label: 'Certifié',
    icon: Award,
    color: 'text-gold',
    bg: 'bg-gold/10 border-gold/20',
  },
  TERMINE_SANS_CERTIFICAT: {
    label: 'Diplômé',
    icon: BookOpen,
    color: 'text-t2',
    bg: 'bg-white/5 border-line',
  },
};

interface LearnerCardProps {
  learner: Learner;
  featured?: boolean;
}

export default function LearnerCard({ learner, featured = false }: LearnerCardProps) {
  const cfg = STATUS_CONFIG[learner.status];
  const StatusIcon = cfg.icon;
  const isCertified = learner.status === 'TERMINE_AVEC_CERTIFICAT';

  if (featured) {
    return (
      <Link
        to={`/apprenants/${learner.slug}`}
        className="group relative block bg-white/4 border border-line rounded-2xl overflow-hidden hover:border-gold/35 transition-all duration-300 hover:-translate-y-0.5"
      >
        {isCertified && (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
        )}

        <div className="p-6">
          {/* Quote mark */}
          {learner.bio && (
            <p className="text-3xl text-gold/20 font-serif leading-none mb-2 select-none">"</p>
          )}

          {/* Bio as quote */}
          {learner.bio && (
            <p className="text-sm text-t2 leading-relaxed line-clamp-3 mb-5 italic">
              {learner.bio}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3">
            {learner.photoUrl ? (
              <img
                src={learner.photoUrl}
                alt={learner.fullName}
                className={`w-11 h-11 rounded-full object-cover border-2 flex-shrink-0 transition-colors ${
                  isCertified ? 'border-gold/40 group-hover:border-gold/70' : 'border-line group-hover:border-line-strong'
                }`}
              />
            ) : (
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                isCertified
                  ? 'bg-gold/15 border border-gold/30 text-gold group-hover:bg-gold/25'
                  : 'bg-white/8 border border-line text-t2'
              }`}>
                {learner.firstName[0]}{learner.lastName[0]}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate">{learner.fullName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {learner.cohort && (
                  <span className="text-xs text-t4">Cohorte {learner.cohort}</span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-t4 group-hover:text-gold/60 transition-colors flex-shrink-0" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/apprenants/${learner.slug}`}
      className="group block bg-white/4 border border-line rounded-2xl overflow-hidden hover:border-gold/30 hover:bg-white/6 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="p-5">
        {/* Avatar + nom */}
        <div className="flex items-start gap-3 mb-3">
          {learner.photoUrl ? (
            <img
              src={learner.photoUrl}
              alt={learner.fullName}
              className={`w-12 h-12 rounded-full object-cover border-2 flex-shrink-0 transition-colors ${
                isCertified ? 'border-gold/40 group-hover:border-gold/60' : 'border-line group-hover:border-line-strong'
              }`}
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
              isCertified ? 'bg-gold/15 border border-gold/25 text-gold' : 'bg-white/8 border border-line text-t3'
            }`}>
              {learner.firstName[0]}{learner.lastName[0]}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm truncate">{learner.fullName}</h3>
            {learner.cohort && (
              <p className="text-xs text-t4 mt-0.5">Cohorte {learner.cohort}</p>
            )}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium mt-1.5 ${cfg.bg} ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Bio */}
        {learner.bio && (
          <p className="text-xs text-t3 line-clamp-2 mb-3 leading-relaxed">{learner.bio}</p>
        )}

        {/* Liens */}
        {(learner.linkedinUrl || learner.portfolioUrl) && (
          <div className="flex items-center gap-3 pt-3 border-t border-line-soft">
            {learner.linkedinUrl && (
              <a
                href={learner.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-t4 hover:text-blue-400 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            )}
            {learner.portfolioUrl && (
              <a
                href={learner.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-t4 hover:text-gold transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Portfolio
              </a>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
