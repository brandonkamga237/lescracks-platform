import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface FilterChipsProps<T extends string> {
  /** Announced to screen readers; never rendered visually. */
  legend: string;
  options: Array<[T, string]>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  allLabel?: string;
}

/**
 * The single filter control for the whole site: editorial tabs.
 *
 * A hairline rule carries mono uppercase labels; the active tab is marked by a
 * gold underline — the same grammar magazines use for their table of contents.
 * Buttons keep a 44px target for touch.
 */
export default function FilterChips<T extends string>({
  legend,
  options,
  value,
  onChange,
  allLabel = 'Tout',
}: FilterChipsProps<T>) {
  const entries: Array<[T | undefined, string]> = [[undefined, allLabel], ...options];
  const listRef = useRef<HTMLFieldSetElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; y: number; width: number } | null>(null);
  // Transitions start one frame after the first measure, so the line never flies in on page load.
  const [ready, setReady] = useState(false);
  const activeIndex = entries.findIndex(([option]) => option === value);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
      setIndicator(active ? { x: active.offsetLeft, y: active.offsetTop + active.offsetHeight, width: active.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.querySelectorAll('button').forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, [activeIndex]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <fieldset ref={listRef} className="relative flex flex-wrap items-end gap-x-7 border-b border-line-soft">
      <legend className="sr-only">{legend}</legend>
      {entries.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option ?? '__all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`relative inline-flex min-h-11 items-center pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              active ? 'text-gold-ink' : 'text-t3 hover:text-t1'
            }`}
          >
            {label}
          </button>
        );
      })}
      {indicator && (
        <span
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 h-px w-px origin-left bg-gold-400 ${ready ? 'transition-transform [transition-duration:250ms] ease-in-out motion-reduce:transition-none' : ''}`}
          // Measured at runtime: position and width come from the active button.
          style={{ transform: `translate(${indicator.x}px, ${indicator.y}px) scaleX(${indicator.width})` }}
        />
      )}
    </fieldset>
  );
}
