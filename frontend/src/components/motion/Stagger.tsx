import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

import { EASE, REVEAL_VIEWPORT } from '@/lib/motion';

const LIST: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } };
const ITEM: Variants = { hidden: { opacity: 0, y: 28 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } };

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** A list whose items arrive one after the other the first time it is scrolled to. */
export function Stagger({ children, className }: StaggerProps) {
  return <motion.ul className={className} variants={LIST} initial="hidden" whileInView="shown" viewport={REVEAL_VIEWPORT}>{children}</motion.ul>;
}

export function StaggerItem({ children, className }: StaggerProps) {
  return <motion.li className={className} variants={ITEM}>{children}</motion.li>;
}
