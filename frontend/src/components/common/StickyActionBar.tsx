import { useEffect, useState, type ReactNode, type RefObject } from 'react';

interface StickyActionBarProps {
  /** The in-page actions this bar stands in for: the bar shows only while they are off screen. */
  anchor: RefObject<Element | null>;
  children: ReactNode;
  /** Breakpoint classes, e.g. `lg:hidden` where a sticky sidebar already keeps the actions in view. */
  className?: string;
  label: string;
}

/**
 * The page's main actions, kept within reach: they sit in the page where they belong, and once
 * the reader scrolls past them they follow along, fixed at the bottom of the screen, just above
 * the phone tab bar.
 */
export default function StickyActionBar({ anchor, children, className = '', label }: StickyActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = anchor.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [anchor]);

  return (
    <>
      {/* Room at the end of the page, so the bar never covers its last lines. */}
      <div aria-hidden className={`h-20 ${className}`} />
      <div role="region" aria-label={label} aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 px-3 pb-2 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none lg:bottom-6 lg:px-0 lg:pb-0 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-3 opacity-0'} ${className}`}>
        <div className="mode-raised mx-auto flex max-w-2xl items-center gap-3 rounded-lg border border-gold-400/30 bg-card p-2.5 pl-4 shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
          {children}
        </div>
      </div>
    </>
  );
}
