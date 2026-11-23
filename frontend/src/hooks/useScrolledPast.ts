import { useState } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';

/** True once the page has scrolled further than `offset` pixels. */
export function useScrolledPast(offset: number): boolean {
  const [past, setPast] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => setPast(y > offset));
  return past;
}
