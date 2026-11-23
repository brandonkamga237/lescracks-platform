import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { EASE, REVEAL_VIEWPORT } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Rises into place the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0.1 }: RevealProps) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={REVEAL_VIEWPORT} transition={{ duration: 0.8, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}
