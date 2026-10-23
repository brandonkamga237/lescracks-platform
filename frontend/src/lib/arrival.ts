import type { SignupContext } from '@/services/types';

// The first page someone landed on, and the channel that sent them, kept until they create an
// account: it tells which content and which network actually bring members in. Stored on this
// device only, sent once at sign-up.
const KEY = 'lescracks.arrival';
const SOURCE_KEY = 'lescracks.arrival.source';

// Referrer hosts, by the name the dashboard shows.
const CHANNELS: Array<[RegExp, string]> = [
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'WhatsApp'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, 'Facebook'],
  [/(^|\.)(instagram\.com)$/, 'Instagram'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X'],
  [/(^|\.)(t\.me|telegram\.org)$/, 'Telegram'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)github\.com$/, 'GitHub'],
  [/(^|\.)google\.[a-z.]+$/, 'Google'],
  [/(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com)$/, 'Autre moteur de recherche'],
];

/** A campaign tag wins (?utm_source=…), then the site that sent the visitor; nothing at all reads as direct. */
function channel(search: string): string {
  const tag = new URLSearchParams(search).get('utm_source')?.trim();
  if (tag) return tag.slice(0, 60);
  let host = '';
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch { host = ''; }
  if (!host || host === window.location.hostname.replace(/^www\./, '')) return 'Direct';
  return CHANNELS.find(([pattern]) => pattern.test(host))?.[1] ?? host.slice(0, 60);
}

export function rememberArrival(path: string, search = '') {
  try {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, path.slice(0, 255));
    if (!localStorage.getItem(SOURCE_KEY)) localStorage.setItem(SOURCE_KEY, channel(search));
  } catch { /* storage blocked: the context is a bonus */ }
}

export function signupContext(): SignupContext {
  let path: string | undefined;
  let source: string | undefined;
  try {
    path = localStorage.getItem(KEY) ?? undefined;
    source = localStorage.getItem(SOURCE_KEY) ?? undefined;
  } catch { path = undefined; }
  return {
    path,
    source,
    language: navigator.language?.slice(0, 20),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone?.slice(0, 64),
  };
}
