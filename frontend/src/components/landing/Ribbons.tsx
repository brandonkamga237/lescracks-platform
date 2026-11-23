import { Fragment, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import Marquee from '@/components/landing/Marquee';

const GOLD_WORDS = ['Apprendre', 'Partager', 'Pratiquer', 'Progresser'];
const DARK_WORDS = ['Articles', 'Ateliers', 'Webinaires', 'Le Talk', 'Attestations'];

function Words({ words, dark }: { words: string[]; dark: boolean }) {
  // Repeated so that one copy is always wider than the screen, whatever its width.
  const line = [...words, ...words, ...words, ...words];
  return (
    <>
      {line.map((word, index) => (
        <Fragment key={index}>
          <span className={`whitespace-nowrap px-5 text-lg font-semibold uppercase tracking-[0.04em] sm:px-7 sm:text-2xl ${dark ? 'text-white/85' : ''}`}>{word}</span>
          <span className={`text-lg sm:text-2xl ${dark ? 'text-gold-400' : ''}`}>✦</span>
        </Fragment>
      ))}
    </>
  );
}

/** Two crossed bands of words between sections; they straighten a little as they pass. */
export default function Ribbons() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const goldTurn = useTransform(scrollYProgress, [0, 1], [-6.4, -2]);
  const darkTurn = useTransform(scrollYProgress, [0, 1], [4.8, 1.5]);

  return (
    <div ref={ref} aria-hidden="true" className="relative h-52 overflow-hidden sm:h-64">
      <div className="absolute inset-x-[-6%] top-1/2 -translate-y-1/2">
        <motion.div style={{ rotate: reduced ? -4 : goldTurn }} className="bg-gold-400 py-3.5 text-black sm:py-4">
          <Marquee speed={0.8}><Words words={GOLD_WORDS} dark={false} /></Marquee>
        </motion.div>
      </div>
      <div className="absolute inset-x-[-6%] top-1/2 -translate-y-1/2">
        <motion.div style={{ rotate: reduced ? 3 : darkTurn }} className="border-y border-white/10 bg-[#111111] py-3.5 sm:py-4">
          <Marquee speed={-0.7}><Words words={DARK_WORDS} dark /></Marquee>
        </motion.div>
      </div>
    </div>
  );
}
