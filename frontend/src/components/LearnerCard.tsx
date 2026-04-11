// src/components/LearnerCard.tsx
import { Link } from 'react-router-dom';
import { Linkedin, Globe, Award } from 'lucide-react';
import type { Learner, LearnerStatus } from '@/services/api';

const STATUS_LABELS: Record<LearnerStatus, string> = {
  EN_COURS: 'En cours',
  TERMINE_AVEC_CERTIFICAT: 'Certifié',
  TERMINE_SANS_CERTIFICAT: 'Diplômé',
};

const STATUS_COLORS: Record<LearnerStatus, string> = {
  EN_COURS: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  TERMINE_AVEC_CERTIFICAT: 'bg-gold/10 text-gold border border-gold/20',
  TERMINE_SANS_CERTIFICAT: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

interface LearnerCardProps {
  learner: Learner;
  compact?: boolean;
}

export default function LearnerCard({ learner, compact = false }: LearnerCardProps) {
  return (
    <Link
      to={`/apprenants/${learner.slug}`}
      className="group block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-gold/30 hover:bg-white/8 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className={`p-5 ${compact ? '' : 'p-6'}`}>
        {/* Avatar + nom */}
        <div className="flex items-start gap-4 mb-4">
          {learner.photoUrl ? (
            <img
              src={learner.photoUrl}
              alt={learner.fullName}
              className={`rounded-full object-cover border-2 border-white/10 group-hover:border-gold/40 transition-colors flex-shrink-0 ${compact ? 'w-11 h-11' : 'w-14 h-14'}`}
            />
          ) : (
            <div className={`rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold flex-shrink-0 ${compact ? 'w-11 h-11 text-base' : 'w-14 h-14 text-xl'}`}>
              {learner.firstName[0]}{learner.lastName[0]}
            </div>
          )}
          <div className="min-w-0">
            <h3 className={`font-semibold text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>{learner.fullName}</h3>
            {learner.cohort && (
              <p className="text-xs text-white/40 mt-0.5">Cohorte {learner.cohort}</p>
            )}
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1.5 font-medium ${STATUS_COLORS[learner.status]}`}>
              {learner.status === 'TERMINE_AVEC_CERTIFICAT' && <Award className="w-3 h-3 inline mr-1 -mt-0.5" />}
              {STATUS_LABELS[learner.status]}
            </span>
          </div>
        </div>

        {/* Bio */}
        {!compact && learner.bio && (
          <p className="text-sm text-white/50 line-clamp-2 mb-4">{learner.bio}</p>
        )}

        {/* Liens */}
        <div className="flex items-center gap-3 mt-auto">
          {learner.linkedinUrl && (
            <a
              href={learner.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-blue-400 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
              {!compact && <span>LinkedIn</span>}
            </a>
          )}
          {learner.portfolioUrl && (
            <a
              href={learner.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-gold transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {!compact && <span>Portfolio</span>}
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}
