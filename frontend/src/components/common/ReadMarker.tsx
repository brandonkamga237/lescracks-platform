import { useEffect, useRef } from 'react';

import { track } from '@/lib/analytics';

interface ReadMarkerProps {
  /** Umami event sent once, when the marker scrolls into view. */
  event: string;
  data?: Record<string, string | number>;
}

/** An invisible line at the end of a text: reaching it means the reader got to the end. */
export default function ReadMarker({ event, data }: ReadMarkerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const label = JSON.stringify(data ?? {});

  useEffect(() => {
    const marker = ref.current;
    if (!marker || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      track(event, JSON.parse(label));
      observer.disconnect();
    });
    observer.observe(marker);
    return () => observer.disconnect();
  }, [event, label]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}
