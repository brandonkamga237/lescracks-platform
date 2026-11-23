import { useEffect, useState } from 'react';

/** The id of the section, among `ids`, that crosses the middle of the screen; null between them. */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
        else setActive((current) => (current === entry.target.id ? null : current));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    key.split('|').forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [key]);

  return active;
}
