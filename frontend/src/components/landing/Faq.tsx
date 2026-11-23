import { ParallaxImage } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { Accordion, type AccordionItem } from '@/components/ui/accordion';
import { Band } from '@/components/ui/band';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { COMMUNITY_URL, illustrationSrc } from '@/config/site';

const QUESTIONS: AccordionItem[] = [
  { title: 'LesCracks, c’est pour qui ?', content: 'Pour toute personne qui veut apprendre la tech ou progresser : étudiants, développeurs en poste, personnes en reconversion. Tu viens lire, tu viens aux ateliers, tu rencontres des gens qui font le métier.' },
  { title: 'Comment se passent les rendez-vous ?', content: 'Chaque rendez-vous a sa page : date, lieu ou format, programme. Tu t’inscris depuis ton compte, et il apparaît dans ton espace avec tes autres inscriptions.' },
  { title: 'À quoi sert une attestation ?', content: 'Elle prouve ta participation à un rendez-vous. Chaque attestation a un code unique : n’importe qui, un recruteur par exemple, peut la vérifier en ligne.' },
  { title: 'Quand arrivent les cours ?', content: 'Les premiers parcours sont en préparation. Ils seront annoncés sur la plateforme et dans la newsletter.' },
  { title: 'Comment proposer un sujet ou intervenir ?', content: 'Écris-nous sur le groupe WhatsApp de la communauté : un atelier à animer, un article à écrire, un parcours à raconter dans le Talk.' },
];

/** The questions people ask before signing up. */
export default function Faq() {
  return (
    <Band id="faq" tone="ivory" labelledBy="faq-title">
      <Container className="grid gap-12 pb-32 pt-20 sm:pt-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <SectionHeading id="faq-title" tone="light" eyebrow="FAQ" title={['Questions fréquentes']} />
          <Reveal>
            <p className="mt-6 max-w-sm text-black/60">
              Une autre question ? Pose-la à la communauté sur <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-black underline decoration-black/25 underline-offset-4 hover:decoration-black">WhatsApp</a>, on y répond vite.
            </p>
          </Reveal>
          <ParallaxImage src={illustrationSrc('speech')} rotate={10} className="mt-12 hidden w-48 lg:block" />
        </div>
        <Reveal><Accordion items={QUESTIONS} tone="light" /></Reveal>
      </Container>
    </Band>
  );
}
