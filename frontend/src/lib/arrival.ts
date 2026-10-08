import type { SignupContext } from '@/services/types';

// The first page someone landed on, kept until they create an account: it tells which
// content actually brings members in. Stored on this device only, sent once at sign-up.
const KEY = 'lescracks.arrival';

export function rememberArrival(path: string) {
  try {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, path.slice(0, 255));
  } catch { /* storage blocked: the context is a bonus */ }
}

export function signupContext(): SignupContext {
  let path: string | undefined;
  try { path = localStorage.getItem(KEY) ?? undefined; } catch { path = undefined; }
  return {
    path,
    language: navigator.language?.slice(0, 20),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone?.slice(0, 64),
  };
}
