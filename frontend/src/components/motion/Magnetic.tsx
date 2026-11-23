import type { PointerEvent, ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

import { cn } from '@/lib/utils';

const SPRING = { stiffness: 260, damping: 18, mass: 0.6 };

interface MagneticProps {
  children: ReactNode;
  /** Layout of the wrapper; a full-width child on phones needs `w-full sm:w-auto` here. */
  className?: string;
}

/** Makes what it wraps lean toward a mouse pointer, a hint that it can be pressed. */
export function Magnetic({ children, className }: MagneticProps) {
  const reduced = useReducedMotion();
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const x = useSpring(offsetX, SPRING);
  const y = useSpring(offsetY, SPRING);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    offsetX.set((event.clientX - box.left - box.width / 2) * 0.2);
    offsetY.set((event.clientY - box.top - box.height / 2) * 0.3);
  };
  const settle = () => { offsetX.set(0); offsetY.set(0); };

  return (
    <motion.div style={{ x, y }} onPointerMove={follow} onPointerLeave={settle} className={cn('inline-flex', className)}>
      {children}
    </motion.div>
  );
}
