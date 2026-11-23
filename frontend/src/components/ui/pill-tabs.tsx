import { cn } from '@/lib/utils';

interface PillTabsProps<T extends string> {
  /** Announced to screen readers; never shown. */
  legend: string;
  options: Array<[T, string]>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  allLabel?: string;
}

/** A filter as a row of pills, the chosen one filled gold, scrolling sideways on a phone. */
export function PillTabs<T extends string>({ legend, options, value, onChange, allLabel = 'Tout' }: PillTabsProps<T>) {
  const entries: Array<[T | undefined, string]> = [[undefined, allLabel], ...options];
  return (
    <fieldset className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex w-max gap-2">
        {entries.map(([key, label]) => {
          const active = key === value;
          return (
            <button key={key ?? 'all'} type="button" aria-pressed={active} onClick={() => onChange(key)}
              className={cn('h-10 shrink-0 rounded-full border px-4 text-sm transition-colors', active ? 'border-gold-400 bg-gold-400 font-medium text-black' : 'border-white/12 text-white/65 hover:border-white/35 hover:text-white')}>
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
