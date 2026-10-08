import { useId, useState } from 'react';
import type { CountryCode } from 'libphonenumber-js';

import { OTHER_COUNTRIES, PINNED_COUNTRIES, formatAsTyped, fromE164, guessCountry, toE164 } from '@/lib/phone';

interface PhoneFieldProps {
  /** E.164 or empty. */
  value: string;
  /** Receives the E.164 number when valid, '' when empty, null while what is typed is not a valid number yet. */
  onChange: (e164: string | null) => void;
  label?: string;
  hint?: string;
  required?: boolean;
  autoFocus?: boolean;
}

/** Country (with its indicator) then the number, formatted as typed and checked for that country. */
export default function PhoneField({ value, onChange, label = 'Téléphone', hint, required = false, autoFocus = false }: PhoneFieldProps) {
  const id = useId();
  const initial = fromE164(value);
  const [country, setCountry] = useState<CountryCode>(initial.country ?? guessCountry());
  const [national, setNational] = useState(initial.national);
  const [touched, setTouched] = useState(false);
  const e164 = national.trim() ? toE164(country, national) : '';
  const invalid = touched && e164 === null;

  function update(nextCountry: CountryCode, nextNational: string) {
    setCountry(nextCountry);
    setNational(nextNational);
    onChange(nextNational.trim() ? toE164(nextCountry, nextNational) : '');
  }

  return (
    <div>
      <label htmlFor={`${id}-number`} className="text-sm font-medium text-t1">{label}</label>
      <div className="mt-2 flex gap-2">
        <label htmlFor={`${id}-country`} className="sr-only">Pays</label>
        <select id={`${id}-country`} value={country} onChange={(event) => update(event.target.value as CountryCode, national)}
          className="input w-32 shrink-0 pr-8 sm:w-40" autoComplete="tel-country-code">
          <optgroup label="Fréquents">
            {PINNED_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.dial} {item.name}</option>)}
          </optgroup>
          <optgroup label="Tous les pays">
            {OTHER_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.dial} {item.name}</option>)}
          </optgroup>
        </select>
        {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
        <input id={`${id}-number`} type="tel" inputMode="tel" autoComplete="tel-national" autoFocus={autoFocus} required={required}
          value={national} onChange={(event) => update(country, formatAsTyped(country, event.target.value))} onBlur={() => setTouched(true)}
          placeholder="6 77 12 34 56" aria-invalid={invalid} aria-describedby={`${id}-hint`}
          className={`input min-w-0 flex-1 text-base ${invalid ? 'border-error' : ''}`} />
      </div>
      <p id={`${id}-hint`} role={invalid ? 'alert' : undefined} className={`mt-2 text-xs leading-relaxed ${invalid ? 'text-error-ink' : 'text-t4'}`}>
        {invalid ? 'Ce numéro ne correspond pas au pays choisi. Vérifie l’indicatif et le nombre de chiffres.' : hint}
      </p>
    </div>
  );
}
