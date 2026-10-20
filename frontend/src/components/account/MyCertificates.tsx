import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

/** The member's issued attestations, each opening its document. Nothing shows until there is one. */
export default function MyCertificates() {
  const certificates = useApi((signal) => api.myCertificates(signal), []);
  if (!certificates.data?.length) return null;

  return (
    <section aria-labelledby="certificates-heading" className="mt-6">
      <h2 id="certificates-heading" className="text-lg text-t1 sm:text-xl">Mes attestations</h2>
      <ul className="mt-4 space-y-3">
        {certificates.data.map((certificate) => (
          <li key={certificate.code}>
            <Link to={`/attestations/${certificate.code}`} className="group flex gap-4 rounded-lg border border-line-soft bg-card p-4 transition-colors hover:border-line sm:p-5">
              <Award aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-t1 first-letter:uppercase">{certificate.title}</p>
                {certificate.detail && <p className="mt-1 truncate text-xs text-t3">{certificate.detail}</p>}
                {certificate.issuedAt && <p className="mt-1 text-xs text-t4">Délivrée le {dateFormat.format(new Date(certificate.issuedAt))}</p>}
              </div>
              <ArrowRight aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-ink" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
