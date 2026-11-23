import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ParallaxImage } from '@/components/motion/Parallax';
import { ScaleInSection } from '@/components/motion/ScaleInSection';
import { EASE } from '@/lib/motion';

const WHATSAPP = 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK';

const QUESTIONS: Array<[string, string]> = [
  ['LesCracks, c’est pour qui ?', 'Pour toute personne qui veut apprendre la tech ou progresser : étudiants, développeurs en poste, personnes en reconversion. Tu viens lire, tu viens aux ateliers, tu rencontres des gens qui font le métier.'],
  ['Comment se passent les rendez-vous ?', 'Chaque rendez-vous a sa page : date, lieu ou format, programme. Tu t’inscris depuis ton compte, et il apparaît dans ton espace avec tes autres inscriptions.'],
  ['À quoi sert une attestation ?', 'Elle prouve ta participation à un rendez-vous. Chaque attestation a un code unique : n’importe qui, un recruteur par exemple, peut la vérifier en ligne.'],
  ['Quand arrivent les cours ?', 'Les premiers parcours sont en préparation. Ils seront annoncés sur la plateforme et dans la newsletter.'],
  ['Comment proposer un sujet ou intervenir ?', 'Écris-nous sur le groupe WhatsApp de la communauté : un atelier à animer, un article à écrire, un parcours à raconter dans le Talk.'],
];

/** The questions people ask before signing up, one answer open at a time. */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ScaleInSection id="faq" labelledBy="faq-title" className="relative z-10 rounded-t-[2rem] bg-[#f4f3ee] text-[#0a0a0a] sm:rounded-t-[3rem]">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-4 pb-32 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <Reveal><p className="text-sm font-medium text-gold-700">FAQ</p></Reveal>
          <SplitText id="faq-title" parts={['Questions fréquentes']} className="mt-5 text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]" />
          <Reveal>
            <p className="mt-6 max-w-sm text-black/60">
              Une autre question ? Pose-la à la communauté sur <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-medium text-black underline decoration-black/25 underline-offset-4 hover:decoration-black">WhatsApp</a>, on y répond vite.
            </p>
          </Reveal>
          <ParallaxImage src="/images/illustrations/speech.webp" rotate={10} className="mt-12 hidden w-48 lg:block" />
        </div>

        <Stagger className="border-t border-black/10">
          {QUESTIONS.map(([question, answer], index) => {
            const expanded = open === index;
            return (
              <StaggerItem key={question} className="border-b border-black/10">
                <h3>
                  <button
                    type="button"
                    id={`faq-question-${index}`}
                    aria-expanded={expanded}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpen(expanded ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-tight sm:text-xl"
                  >
                    {question}
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/20 transition-transform duration-300 ${expanded ? 'rotate-45' : ''}`} aria-hidden="true">
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 leading-relaxed text-black/65">{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </ScaleInSection>
  );
}
