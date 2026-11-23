import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';

import DashSection from '@/components/member/DashSection';
import BadgeList from '@/components/recognition/BadgeList';
import type { Certificate, MemberBadge } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

interface MyRecognitionProps {
  certificates: Certificate[];
  badges: MemberBadge[];
}

/** What the member has earned: attestations anyone can check, and badges. */
export default function MyRecognition({ certificates, badges }: MyRecognitionProps) {
  const issued = certificates.filter((certificate) => !certificate.revoked);
  return (
    <DashSection id="recognition-title" title="Attestations et badges">
      {issued.length === 0 && badges.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/55">Ta première attestation arrive après ton premier rendez-vous, avec un lien vérifiable à partager.</p>
      )}
      {issued.length > 0 && (
        <ul className="space-y-2">
          {issued.map((certificate) => (
            <li key={certificate.code}>
              <Link to={`/attestations/${certificate.code}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-gold-400/40">
                <Award className="h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium first-letter:uppercase group-hover:text-gold-400">{certificate.title}</span>
                  {certificate.issuedAt && <span className="block text-xs text-white/45">Délivrée le {dateFormat.format(new Date(certificate.issuedAt))}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {badges.length > 0 && <div className="mt-3"><BadgeList badges={badges} compact /></div>}
    </DashSection>
  );
}
