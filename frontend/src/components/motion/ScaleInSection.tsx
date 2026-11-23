import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface ScaleInSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}

/** A section that grows to full size as it arrives, so it reads as laid over the one before. */
export function ScaleInSection({ children, className, id, labelledBy }: ScaleInSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  return (
    <motion.section ref={ref} id={id} aria-labelledby={labelledBy} style={reduced ? undefined : { scale }} className={className}>
      {children}
    </motion.section>
  );
}
