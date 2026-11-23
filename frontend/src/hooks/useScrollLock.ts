import { useEffect } from 'react';

/** Keeps the page from scrolling while `locked`, for a full-screen layer such as a menu. */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous; };
  }, [locked]);
}
