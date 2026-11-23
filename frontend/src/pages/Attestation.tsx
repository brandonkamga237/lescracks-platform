import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Download, Link2, ShieldCheck } from 'lucide-react';

import SEO from '@/components/common/SEO';
import CertificateDocument from '@/components/recognition/CertificateDocument';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyPanel, ErrorPanel } from '@/components/ui/panels';
import { useApi } from '@/hooks/useApi';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
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
    <Container className="pb-16 pt-8 sm:pt-10">
      <SEO title={certificate.data ? `Attestation de ${certificate.data.holderName}` : 'Attestation'} url={`/attestations/${code}`} noindex description="Une attestation LesCracks, vérifiable par son code." />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium text-gold-400">Attestation</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Vérification <span className="font-mono text-white/40">{code}</span></h1>

        <div className="mt-6">
          {certificate.loading && <div aria-hidden="true" className="aspect-[1.414] w-full animate-pulse rounded-3xl bg-white/[0.03] motion-reduce:animate-none" />}
          {missing && <EmptyPanel title="Aucune attestation ne porte ce code." description="Vérifie les caractères : le code compte dix lettres et chiffres, sans 0 ni 1." />}
          {!missing && certificate.error && <ErrorPanel title="L’attestation est momentanément indisponible." message={certificate.error.message} onRetry={certificate.reload} />}
          {certificate.data && (
            <>
              <p className={cn('mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm', certificate.data.revoked ? 'border-error/30 text-error-ink' : 'border-gold-400/30 bg-gold-400/10 text-gold-400')}>
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                {certificate.data.revoked ? 'Cette attestation a été révoquée par LesCracks.' : 'Attestation authentique, délivrée par LesCracks.'}
              </p>
              <CertificateDocument certificate={certificate.data} />
              {!certificate.data.revoked && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" size="lg" className="font-semibold" onClick={() => { track('Attestation téléchargée'); window.print(); }}><Download className="h-4 w-4" aria-hidden="true" />Télécharger en PDF</Button>
                  <Button type="button" size="lg" variant="outline" onClick={() => void copyLink()}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}{copied ? 'Lien copié' : 'Copier le lien'}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
