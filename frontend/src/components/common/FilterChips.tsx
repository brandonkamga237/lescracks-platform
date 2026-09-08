interface FilterChipsProps<T extends string> {
  /** Announced to screen readers; never rendered visually. */
  legend: string;
  options: Array<[T, string]>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  allLabel?: string;
}

/**
 * The single filter control for the whole site.
 *
 * Catalogue pages each had their own pill style — underlined tabs here, left-rail buttons
 * there — and all of them fell under the 44px touch target that most of our traffic needs.
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
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      {entries.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option ?? '__all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              active
                ? 'border-gold-400/50 bg-gold-400/10 text-gold-300'
                : 'border-line-soft/70 bg-noir-900/40 text-t3 hover:border-line hover:text-t1'
            }`}
          >
            {label}
          </button>
        );
      })}
    </fieldset>
  );
}
