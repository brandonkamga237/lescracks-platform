import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import MagneticLink from '@/components/landing/MagneticLink';
import { RevealWords } from '@/components/landing/motion';
import TileGrid from '@/components/landing/TileGrid';
import { deriveEventStatus } from '@/lib/eventStatus';
import { eventTeaser } from '@/lib/eventMoment';
import { EASE } from '@/lib/motion';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

const ARRIVE = { initial: { opacity: 0, y: 16, filter: 'blur(6px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } };

interface HeroProps {
  nextEvent?: EventSummary;
  isSignedIn: boolean;
}

/** The promise, the next rendez-vous as a pill above it, and the way in. */
export default function Hero({ nextEvent, isSignedIn }: HeroProps) {
  const live = nextEvent ? deriveEventStatus(nextEvent.startDate, nextEvent.endDate) === 'open' : false;

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(212,175,55,0.10),transparent_70%)]" />
      <TileGrid fade="hero" spotlight />

      <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-8">
        {nextEvent && (
          <motion.div {...ARRIVE} transition={{ duration: 0.9, ease: EASE }}>
            <Link to={eventPath(nextEvent)} className="group mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-[13px] text-white/75 backdrop-blur transition-colors hover:border-gold-400/50 hover:text-white">
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-400/15 px-2.5 py-0.5 text-[11px] font-medium text-gold-400">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-400" />
                </span>
                {live ? 'En direct' : eventTeaser(nextEvent.startDate)}
              </span>
              <span className="truncate">{TYPE_LABEL[nextEvent.type]}{nextEvent.format === 'ONLINE' ? ' en ligne' : ''} : {nextEvent.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        <RevealWords
          as="h1"
          id="hero-title"
          onMount
          delay={0.15}
          parts={['Apprends la tech', { text: 'avec ceux qui la font.', className: 'text-gold-400 sm:block' }]}
          className="mt-8 text-[clamp(2.5rem,6.4vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        />

        <motion.p {...ARRIVE} transition={{ duration: 0.9, delay: 0.25, ease: EASE }} className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
          Articles techniques, ateliers en direct, conversations avec des pros, et bientôt des cours. Une communauté qui apprend en pratiquant.
        </motion.p>

        <motion.div {...ARRIVE} transition={{ duration: 0.9, delay: 0.37, ease: EASE }} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MagneticLink to={isSignedIn ? '/profil' : '/inscription'} className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold-400 px-7 font-medium text-black transition-colors hover:bg-gold-300 sm:w-auto">
            {isSignedIn ? 'Mon espace' : 'Créer mon compte'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </MagneticLink>
          <MagneticLink to="/evenements" className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 text-white/85 transition-colors hover:border-white/40 sm:w-auto">
            Voir les rendez-vous
          </MagneticLink>
        </motion.div>
      </div>
    </section>
  );
}
