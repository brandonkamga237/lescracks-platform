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

  return (
    <fieldset className="flex flex-wrap items-end gap-x-7 border-b border-line-soft/50">
      <legend className="sr-only">{legend}</legend>
      {entries.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option ?? '__all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`relative inline-flex min-h-11 items-center pb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              active ? 'text-gold-300' : 'text-t3 hover:text-t1'
            }`}
          >
            {label}
            {active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-gold-400" />}
          </button>
        );
      })}
    </fieldset>
  );
}
