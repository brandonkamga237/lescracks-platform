import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalDocumentProps {
  id: string;
  title: string;
  lead: string;
  sections: LegalSection[];
}

/** A legal text set for reading: numbered sections in one narrow column. */
export default function LegalDocument({ id, title, lead, sections }: LegalDocumentProps) {
  return (
    <>
      <PageHero id={id} eyebrow="Informations légales" title={[title]} lead={lead} />
      <Container className="pb-24">
        <ol className="max-w-3xl border-t border-white/10">
          {sections.map((section, index) => (
            <li key={section.title} className="grid gap-4 border-b border-white/10 py-10 sm:grid-cols-[4rem_minmax(0,1fr)]">
              <span aria-hidden="true" className="text-2xl font-semibold tabular-nums text-gold-400">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-[15px] leading-relaxed text-white/60">{paragraph}</p>)}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
