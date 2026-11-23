import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface ParallaxImageProps {
  src: string;
  /** Resting tilt in degrees; the scroll turns it six degrees either way. */
  rotate?: number;
  className?: string;
}

/** A decorative illustration that drifts against the scroll and floats in place. */
export function ParallaxImage({ src, rotate = 0, className = '' }: ParallaxImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const turn = useTransform(scrollYProgress, [0, 1], [rotate - 6, rotate + 6]);
  return (
    <motion.img
      ref={ref}
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={reduced ? { rotate } : { y, rotate: turn }}
      className={`pointer-events-none select-none animate-float motion-reduce:animate-none ${className}`}
    />
  );
}

interface PanelProps {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy: string;
}

/** A full-width band that grows to full size as it arrives, so it reads as laid over the previous one. */
export function Panel({ children, className = '', id, labelledBy }: PanelProps) {
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
