import { useRef, type ReactNode } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useVelocity } from 'framer-motion';

interface MarqueeProps {
  children: ReactNode;
  /** Pixels per frame at rest; negative runs left to right. */
  speed: number;
  className?: string;
}

/**
 * An endless row that drifts on its own and speeds up while the page scrolls. The content is
 * rendered twice so the seam never shows; screen readers get the list once, from the caller.
 */
export default function Marquee({ children, speed, className = '' }: MarqueeProps) {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useAnimationFrame((_, delta) => {
    if (reduced || !track.current) return;
    const half = track.current.scrollWidth / 2;
    const boost = 1 + Math.min(8, Math.abs(velocity.get()) / 300);
    let next = x.get() - speed * boost * Math.min(delta, 64) / 16.67;
    if (next <= -half) next += half;
    if (next > 0) next -= half;
    x.set(next);
  });

  return (
    <div aria-hidden="true" className={`overflow-hidden ${className}`}>
      <motion.div ref={track} style={{ x }} className="flex w-max will-change-transform">
        {children}
        {children}
      </motion.div>
    </div>
  );
}
