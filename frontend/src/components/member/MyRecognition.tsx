import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';

import BadgeList from '@/components/recognition/BadgeList';
import { ArrowCircle } from '@/components/ui/arrow-circle';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
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
    <section id="mes-attestations" aria-labelledby="recognition-title" className="border-t border-white/10">
      <Container className="pb-20 pt-20 sm:pb-28 sm:pt-28">
        <SectionHeading id="recognition-title" eyebrow="Attestations et badges" title={['Ce que tu as gagné.', { text: 'Vérifiable par n’importe qui.', className: 'text-white/40' }]} />

        {issued.length === 0 && badges.length === 0 && (
          <p className="mt-14 max-w-2xl rounded-3xl border border-dashed border-white/15 p-6 text-white/60 sm:p-8">Ta première attestation arrive après ton premier rendez-vous : on la délivre à chaque participation, avec un lien que tu peux partager à un recruteur.</p>
        )}

        {issued.length > 0 && (
          <ul className="mt-14 grid gap-3 md:grid-cols-2">
            {issued.map((certificate) => (
              <li key={certificate.code}>
                <Link to={`/attestations/${certificate.code}`} className="group flex h-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-gold-400/40 sm:p-6">
                  <Award aria-hidden="true" className="h-6 w-6 shrink-0 text-gold-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium first-letter:uppercase">{certificate.title}</span>
                    {certificate.issuedAt && <span className="mt-1 block text-sm text-white/50">Délivrée le {dateFormat.format(new Date(certificate.issuedAt))}</span>}
                  </span>
                  <ArrowCircle />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {badges.length > 0 && (
          <>
            <h3 className="mt-14 text-sm font-medium text-white/50">Mes badges</h3>
            <div className="mt-4"><BadgeList badges={badges} /></div>
          </>
        )}
      </Container>
    </section>
  );
}
