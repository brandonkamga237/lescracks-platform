import { Container } from '@/components/ui/container';
import { SpaceHeader } from '@/components/ui/space-header';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalDocumentProps {
  title: string;
  lead: string;
  sections: LegalSection[];
}

/** A legal text set for reading: numbered sections in one narrow column. */
export default function LegalDocument({ title, lead, sections }: LegalDocumentProps) {
  return (
    <>
      <SpaceHeader title={title} lead={lead} />
      <Container className="pb-24">
        <ol className="max-w-3xl border-t border-white/10">
          {sections.map((section, index) => (
            <li key={section.title} className="grid gap-3 border-b border-white/10 py-7 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <span aria-hidden="true" className="text-lg font-semibold tabular-nums text-gold-400">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-[15px] leading-relaxed text-white/60">{paragraph}</p>)}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
