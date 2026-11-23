import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import TileGrid from '@/components/decor/TileGrid';
import NextEventPill from '@/components/events/NextEventPill';
import { Magnetic } from '@/components/motion/Magnetic';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { EASE } from '@/lib/motion';
import type { EventSummary } from '@/services/types';

const ARRIVE = { initial: { opacity: 0, y: 16, filter: 'blur(6px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } };
const arrive = (delay: number) => ({ ...ARRIVE, transition: { duration: 0.9, delay, ease: EASE } });

interface HeroProps {
  nextEvent?: EventSummary;
  isSignedIn: boolean;
}

/** The promise, the next rendez-vous above it, and the way in. */
export default function Hero({ nextEvent, isSignedIn }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(212,175,55,0.10),transparent_70%)]" />
      <TileGrid fade="hero" spotlight />

      <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-8">
        {nextEvent && <motion.div {...arrive(0)}><NextEventPill event={nextEvent} /></motion.div>}

        <SplitText
          as="h1"
          id="hero-title"
          onMount
          delay={0.15}
          parts={['Apprends la tech', { text: 'avec ceux qui la font.', className: 'text-gold-400 sm:block' }]}
          className="mt-8 text-display-hero font-semibold"
        />

        <motion.p {...arrive(0.25)} className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
          Articles techniques, ateliers en direct, conversations avec des pros, et bientôt des cours. Une communauté qui apprend en pratiquant.
        </motion.p>

        <motion.div {...arrive(0.37)} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Magnetic className="w-full sm:w-auto">
            <Button asChild size="lg" className="w-full">
              <Link to={isSignedIn ? '/profil' : '/inscription'}>
                {isSignedIn ? 'Mon espace' : 'Créer mon compte'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>
          </Magnetic>
          <Magnetic className="w-full sm:w-auto">
            <Button asChild size="lg" variant="outline" className="w-full"><Link to="/rendez-vous">Voir les rendez-vous</Link></Button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}
