import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Inertial scrolling for the page that calls it, with in-page anchors scrolled the same way.
 * Off when the visitor asks for reduced motion: native scrolling is what they expect then.
 */
export function useSmoothScroll(): void {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, anchors: { offset: -96 } });
    return () => lenis.destroy();
  }, [reduced]);
}
