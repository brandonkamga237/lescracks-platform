import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Download, Link2, ShieldCheck } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { Section } from '@/components/layout/Page';
import CertificateDocument from '@/components/recognition/CertificateDocument';
import { useApi } from '@/hooks/useApi';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';

/** An attestation anyone can check by its code, print as a PDF or share. */
export default function Attestation() {
  const { code = '' } = useParams();
  const certificate = useApi((signal) => api.verifyCertificate(code, signal), [code]);
  const [copied, setCopied] = useState(false);
  const missing = certificate.error?.status === 404;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      track('Lien d’attestation copié');
    } catch {
      setCopied(false);
    }
  }

  return (
    <Layout>
      <SEO title={certificate.data ? `Attestation de ${certificate.data.holderName}` : 'Attestation'} url={`/attestations/${code}`} noindex
        description="Une attestation LesCracks, vérifiable par son code." />
      <Section spacing="tight">
        {certificate.loading ? (
          <Skeleton className="mx-auto aspect-[1.414] w-full max-w-4xl rounded-lg" />
        ) : missing ? (
          <EmptyState title="Aucune attestation ne porte ce code." description="Vérifie les caractères : le code compte dix lettres et chiffres, sans 0 ni 1." />
        ) : certificate.error ? (
          <ErrorState title="L’attestation est momentanément indisponible." message={certificate.error.message} onRetry={certificate.reload} />
        ) : certificate.data && (
          <>
            <p className={`mx-auto mb-5 flex max-w-4xl items-center gap-2 text-sm ${certificate.data.revoked ? 'text-error-ink' : 'text-gold-ink'}`}>
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              {certificate.data.revoked ? 'Cette attestation a été révoquée par LesCracks.' : 'Attestation authentique, délivrée par LesCracks.'}
            </p>
            <CertificateDocument certificate={certificate.data} />
            {!certificate.data.revoked && (
              <div className="mx-auto mt-5 flex max-w-4xl flex-wrap gap-3">
                <button type="button" onClick={() => { track('Attestation téléchargée'); window.print(); }} className="btn-primary">
                  <Download className="h-4 w-4" aria-hidden />Télécharger en PDF
                </button>
                <button type="button" onClick={() => void copyLink()} className="btn-secondary">
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}{copied ? 'Lien copié' : 'Copier le lien'}
                </button>
              </div>
            )}
          </>
        )}
      </Section>
    </Layout>
  );
}
