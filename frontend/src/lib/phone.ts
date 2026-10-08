import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

const names = new Intl.DisplayNames(['fr'], { type: 'region' });

// The community first: Central and West Africa, the Maghreb, then the diaspora's countries.
const PINNED: CountryCode[] = ['CM', 'CI', 'SN', 'GA', 'CG', 'CD', 'BJ', 'TG', 'BF', 'ML', 'GN', 'NE', 'TD', 'CF', 'GQ', 'MA', 'TN', 'DZ', 'FR', 'BE', 'CH', 'CA'];

export interface CountryOption { code: CountryCode; name: string; dial: string; }

const option = (code: CountryCode): CountryOption => ({ code, name: names.of(code) ?? code, dial: `+${getCountryCallingCode(code)}` });

export const PINNED_COUNTRIES: CountryOption[] = PINNED.map(option);
export const OTHER_COUNTRIES: CountryOption[] = getCountries().filter((code) => !PINNED.includes(code)).map(option)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export const countryName = (code?: string) => (code ? names.of(code) ?? code : '');

/**
 * A sensible default country: the time zone first, because many browsers in Africa report
 * fr-FR as their language; the language's region next; Cameroon otherwise.
 */
export function guessCountry(): CountryCode {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  const byZone: Record<string, CountryCode> = {
    'Africa/Douala': 'CM', 'Africa/Abidjan': 'CI', 'Africa/Dakar': 'SN', 'Africa/Libreville': 'GA', 'Africa/Brazzaville': 'CG',
    'Africa/Kinshasa': 'CD', 'Africa/Lubumbashi': 'CD', 'Africa/Porto-Novo': 'BJ', 'Africa/Lome': 'TG', 'Africa/Ouagadougou': 'BF',
    'Africa/Bamako': 'ML', 'Africa/Conakry': 'GN', 'Africa/Niamey': 'NE', 'Africa/Ndjamena': 'TD', 'Africa/Bangui': 'CF',
    'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ', 'Europe/Paris': 'FR', 'Europe/Brussels': 'BE',
  };
  if (byZone[zone]) return byZone[zone];
  const region = navigator.language?.split('-')[1]?.toUpperCase();
  if (region && (getCountries() as string[]).includes(region)) return region as CountryCode;
  return 'CM';
}

/** Formats as typed, the way people of that country write their numbers. */
export function formatAsTyped(country: CountryCode, digits: string) {
  return new AsYouType(country).input(digits);
}

/** E.164 when the number is valid for the chosen country, otherwise null. */
export function toE164(country: CountryCode, national: string): string | null {
  const parsed = parsePhoneNumberFromString(national, country);
  return parsed && parsed.isValid() ? parsed.number : null;
}

/** Splits a stored E.164 number back into country and national digits, for editing. */
export function fromE164(e164?: string): { country?: CountryCode; national: string } {
  if (!e164) return { national: '' };
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? { country: parsed.country, national: parsed.formatNational() } : { national: '' };
}

export function displayPhone(e164?: string) {
  if (!e164) return '';
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
