import { Fragment } from 'react';
import { motion, type Variants } from 'framer-motion';

import { EASE, REVEAL_VIEWPORT } from '@/lib/motion';

/** A run of words; an object gives the run its own class (a colour, a line break). */
export type TextPart = string | { text: string; className: string };

interface SplitTextProps {
  parts: TextPart[];
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  id?: string;
  /** Plays on arrival instead of waiting to be scrolled to: a hero. */
  onMount?: boolean;
  delay?: number;
}

const LINE: Variants = { hidden: {}, shown: {} };
const WORD: Variants = { hidden: { y: '110%' }, shown: { y: '0%', transition: { duration: 0.9, ease: EASE } } };
const TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p };

/** Text whose words rise one after the other, each out of its own clipped line. */
export function SplitText({ parts, as = 'h2', className, id, onMount = false, delay = 0 }: SplitTextProps) {
  const Tag = TAGS[as];
  const trigger = onMount ? { animate: 'shown' } : { whileInView: 'shown', viewport: REVEAL_VIEWPORT };
  return (
    <Tag id={id} className={className} variants={LINE} initial="hidden" transition={{ staggerChildren: onMount ? 0.06 : 0.035, delayChildren: delay }} {...trigger}>
      {parts.map((part, index) => {
        const { text, className: runClass } = typeof part === 'string' ? { text: part, className: undefined } : part;
        return (
          <span key={index} className={runClass}>
            {text.split(/\s+/).filter(Boolean).map((word, wordIndex) => (
              <Fragment key={wordIndex}>
                <span className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span className="inline-block" variants={WORD}>{word}</motion.span>
                </span>{' '}
              </Fragment>
            ))}
          </span>
        );
      })}
    </Tag>
  );
}
