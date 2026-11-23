import { Fragment, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

import { EASE } from '@/lib/motion';

const VIEWPORT = { once: true, margin: '0px 0px -10% 0px' } as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Rises into place the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0.1 }: RevealProps) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.8, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

export type WordPart = string | { text: string; className: string };

interface RevealWordsProps {
  parts: WordPart[];
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  id?: string;
  /** The hero plays on arrival; every other heading waits to be scrolled to. */
  onMount?: boolean;
  delay?: number;
}

const WORDS: Variants = { hidden: {}, shown: {} };
const WORD: Variants = { hidden: { y: '110%' }, shown: { y: '0%', transition: { duration: 0.9, ease: EASE } } };
const TAGS = { h1: motion.h1, h2: motion.h2, p: motion.p };

/** A heading whose words rise one after the other out of their own line. */
export function RevealWords({ parts, as = 'h2', className, id, onMount = false, delay = 0 }: RevealWordsProps) {
  const Tag = TAGS[as];
  const trigger = onMount ? { animate: 'shown' } : { whileInView: 'shown', viewport: VIEWPORT };
  return (
    <Tag id={id} className={className} variants={WORDS} initial="hidden" transition={{ staggerChildren: onMount ? 0.06 : 0.035, delayChildren: delay }} {...trigger}>
      {parts.map((part, index) => {
        const { text, className: partClass } = typeof part === 'string' ? { text: part, className: undefined } : part;
        return (
          <span key={index} className={partClass}>
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

const LIST: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } };
const ITEM: Variants = { hidden: { opacity: 0, y: 28 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } };

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** A list whose items arrive one after the other. */
export function StaggerList({ children, className }: StaggerProps) {
  return <motion.ul className={className} variants={LIST} initial="hidden" whileInView="shown" viewport={VIEWPORT}>{children}</motion.ul>;
}

export function StaggerItem({ children, className }: StaggerProps) {
  return <motion.li className={className} variants={ITEM}>{children}</motion.li>;
}
