import LesCracksLogo from '@/components/common/LesCracksLogo';
import type { Certificate, CertificateKind } from '@/services/types';

const KIND_LABEL: Record<CertificateKind, string> = {
  PARTICIPATION: 'Attestation de participation',
  WINNER: 'Attestation de lauréat',
  PODIUM: 'Attestation de podium',
  AMBASSADOR: 'Attestation d’ambassadeur',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

interface CertificateDocumentProps {
  certificate: Pick<Certificate, 'code' | 'kind' | 'holderName' | 'title' | 'detail' | 'eventDate' | 'issuedAt'> & { revoked?: boolean };
  /** A draft previewed in the back office has no issue date yet. */
  draft?: boolean;
}

/**
 * The attestation itself, as a document: dark and gold on screen, black on white once printed so
 * « Télécharger en PDF » (the browser's print to PDF) gives a clean A4 landscape page.
 */
export default function CertificateDocument({ certificate, draft = false }: CertificateDocumentProps) {
  const issued = certificate.issuedAt ? dateFormat.format(new Date(certificate.issuedAt)) : null;
  const held = certificate.eventDate ? dateFormat.format(new Date(certificate.eventDate)) : null;

  return (
    <article className="certificate relative mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-gold-400/50 bg-noir-900 p-2.5 text-t1 sm:aspect-[1.414] sm:p-[3%] print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
      {/* A phone gets the document at its natural height; the A4 landscape frame starts where it fits, and in print. */}
      <div className="flex h-full flex-col rounded border border-gold-400/30 px-5 py-6 sm:px-[6%] sm:py-[5%] print:border-2 print:border-[#d4af37]">
        <header className="flex items-start justify-between gap-4">
          <LesCracksLogo className="h-[clamp(1.5rem,4vw,2.5rem)] w-auto" />
          <p className="text-right text-[clamp(0.55rem,1.4vw,0.8rem)] font-semibold uppercase tracking-[0.18em] text-gold-ink print:text-[#9c7c1c]">{KIND_LABEL[certificate.kind]}</p>
        </header>

        <div className="my-8 flex flex-1 flex-col justify-center text-center sm:my-0">
          <p className="text-[clamp(0.7rem,1.8vw,1rem)] text-t3 print:text-neutral-600">LesCracks atteste que</p>
          <p className="mt-[2%] break-words font-display text-[clamp(1.4rem,5.2vw,3.25rem)] font-bold leading-tight text-t1 print:text-black">{certificate.holderName}</p>
          <p className="mx-auto mt-[2%] max-w-[85%] text-balance text-[clamp(0.8rem,2.2vw,1.25rem)] leading-snug text-t2 print:text-neutral-800">{certificate.title}.</p>
          {certificate.detail && <p className="mt-[1.5%] text-[clamp(0.7rem,1.7vw,0.95rem)] text-gold-ink print:text-[#9c7c1c]">{certificate.detail}</p>}
        </div>

        {/* The base style gives every <p> 16px: the footer lines take their own, smaller size. */}
        <footer className="grid grid-cols-1 items-end gap-4 text-center leading-snug text-t3 sm:grid-cols-3 sm:text-left print:text-neutral-600 [&_p]:text-xs sm:[&_p]:text-[clamp(0.6rem,1.25vw,0.75rem)]">
          <div>
            {held && <p>Événement du {held}</p>}
            <p>{draft ? 'Brouillon : pas encore émise' : issued ? `Délivrée le ${issued}` : ''}</p>
          </div>
          <div className="text-center">
            <span className="block font-display text-sm italic text-t1 sm:text-[clamp(0.75rem,1.9vw,1.1rem)] print:text-black">Brandon Kamga</span>
            <p className="border-t border-line pt-1 print:border-neutral-300">Fondateur de LesCracks</p>
          </div>
          <div className="sm:text-right">
            <p>Vérifiable sur lescracks.com/attestations</p>
            <p className="font-mono font-semibold tracking-[0.12em] text-gold-ink print:text-black">{certificate.code}</p>
          </div>
        </footer>
      </div>

      {certificate.revoked && (
        <p role="status" className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-6 bg-error/90 py-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white">
          Attestation révoquée
        </p>
      )}
    </article>
  );
}
