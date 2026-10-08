import { useId } from 'react';
import { CalendarClock } from 'lucide-react';

import { formatScheduleLong, fromLocalInput, minScheduleInput, quickSchedules, toLocalInput } from '@/lib/schedule';

interface ScheduleFieldProps {
  /** ISO instant, or null when nothing is picked yet. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Latest allowed instant (an event must go out before it starts). */
  before?: string;
  className?: string;
}

/** Date and time of a scheduled publication, with shortcuts for the usual slots. */
export default function ScheduleField({ value, onChange, before, className = '' }: ScheduleFieldProps) {
  const id = useId();
  const tooLate = Boolean(value && before && new Date(value) >= new Date(before));
  const past = Boolean(value && new Date(value).getTime() <= Date.now());
  const quick = quickSchedules().filter(([, iso]) => !before || new Date(iso) < new Date(before));

  return (
    <div className={`rounded-lg border border-gold-400/30 bg-gold-400/[0.05] p-4 ${className}`}>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-t1"><CalendarClock className="h-4 w-4 text-gold-ink" aria-hidden />Publier le</label>
      <input id={id} type="datetime-local" required value={toLocalInput(value)} min={minScheduleInput()} max={before ? toLocalInput(before) : undefined}
        onChange={(event) => onChange(fromLocalInput(event.target.value))} className="input mt-2 w-full sm:w-auto" aria-describedby={`${id}-hint`} />
      {quick.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quick.map(([label, iso]) => (
            <button key={label} type="button" onClick={() => onChange(iso)} aria-pressed={value === iso}
              className={`min-h-8 rounded border px-2.5 text-xs transition-colors ${value === iso ? 'border-gold-400 bg-gold-400/15 text-gold-ink' : 'border-line text-t3 hover:border-gold-400/40 hover:text-t1'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      <p id={`${id}-hint`} role={tooLate || past ? 'alert' : undefined} className={`mt-3 text-xs leading-relaxed ${tooLate || past ? 'text-error-ink' : 'text-t3'}`}>
        {!value ? 'Choisis la date et l’heure de mise en ligne.'
          : past ? 'Cette date est déjà passée : choisis un moment à venir.'
            : tooLate ? 'La publication doit avoir lieu avant le début de l’événement.'
              : `Mise en ligne automatique le ${formatScheduleLong(value)}, heure de ton appareil. D’ici là, le contenu reste un brouillon invisible du public.`}
      </p>
    </div>
  );
}

