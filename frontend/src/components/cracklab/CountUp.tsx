import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

/** Rolls up to a score once. Reduced motion shows the final number straight away. */
export default function CountUp({ value, duration = 900, className = '' }: CountUpProps) {
  const [shown, setShown] = useState(() => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? value : 0));

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={`tabular-nums ${className}`}>{shown}</span>;
}
