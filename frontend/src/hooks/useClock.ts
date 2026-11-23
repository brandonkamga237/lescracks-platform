import { useEffect, useState } from 'react';

/** The current time in `timeZone`, « 14:05 », refreshed often enough for minutes to stay right. */
export function useClock(timeZone: string): string {
  const [format] = useState(() => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone }));
  const [time, setTime] = useState(() => format.format(new Date()));
  useEffect(() => {
    const timer = window.setInterval(() => setTime(format.format(new Date())), 15_000);
    return () => window.clearInterval(timer);
  }, [format]);
  return time;
}
