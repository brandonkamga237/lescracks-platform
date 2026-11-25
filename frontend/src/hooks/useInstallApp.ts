import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

import { track } from '@/lib/analytics';
import { installRoute, isStandalone, type InstallRoute } from '@/lib/installPlatform';
import { installPromptState, promptInstall, subscribeInstallPrompt } from '@/lib/installPrompt';

const VIEWS = 'lescracks.install.views';
const SHOWN = 'lescracks.install.shown';
const SNOOZED = 'lescracks.install.snoozedUntil';
// The signup invitation's snooze: a visitor is asked for an account before being asked for the app.
const SIGNUP_SNOOZED = 'lescracks.nudge.snoozedUntil';
const SNOOZE_MS = 14 * 24 * 3600 * 1000;
const DELAY_MS = 5000;

function read(storage: Storage, key: string) {
  try { return storage.getItem(key); } catch { return null; }
}
function write(storage: Storage, key: string, value: string) {
  try { storage.setItem(key, value); } catch { /* storage blocked: the invitation simply never shows */ }
}

const promptSnapshot = () => { const state = installPromptState(); return `${state.canPrompt}:${state.installed}`; };

/** Which install gesture this phone has, and the one-tap install where the browser offers it. */
export function useInstallApp(): { route: InstallRoute; install: () => Promise<boolean> } {
  const snapshot = useSyncExternalStore(subscribeInstallPrompt, promptSnapshot, () => 'false:false');
  const [canPrompt, installed] = snapshot.split(':').map((part) => part === 'true');
  const route = typeof navigator === 'undefined'
    ? 'desktop'
    : installRoute({ userAgent: navigator.userAgent, touchPoints: navigator.maxTouchPoints, standalone: installed || isStandalone(), canPrompt });

  async function install() {
    const outcome = await promptInstall();
    track('Installation appli', { résultat: outcome });
    return outcome === 'accepted';
  }

  return { route, install };
}

const OFFERED: InstallRoute[] = ['android-prompt', 'android-menu', 'ios-safari', 'ios-other', 'in-app'];

/**
 * When to invite a phone reader to install: once they are clearly using the site (second page of the
 * visit), never on arrival, once per visit, and not again for two weeks after "Plus tard".
 */
export function useInstallNudge(member: boolean) {
  const { pathname } = useLocation();
  const { route, install } = useInstallApp();
  const [open, setOpen] = useState(false);
  const offered = OFFERED.includes(route);

  useEffect(() => {
    if (!offered) return;
    const views = Number(read(sessionStorage, VIEWS) ?? '0') + 1;
    write(sessionStorage, VIEWS, String(views));
    const snoozed = Number(read(localStorage, SNOOZED) ?? '0') > Date.now();
    const visitorNotReady = !member && Number(read(localStorage, SIGNUP_SNOOZED) ?? '0') <= Date.now();
    if (views < 2 || snoozed || visitorNotReady || read(sessionStorage, SHOWN)) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      write(sessionStorage, SHOWN, '1');
      track('Installation appli proposée', { voie: route });
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, offered, member]); // eslint-disable-line react-hooks/exhaustive-deps

  function later() {
    write(localStorage, SNOOZED, String(Date.now() + SNOOZE_MS));
    setOpen(false);
    track('Installation appli reportée', { voie: route });
  }

  return { open: open && offered, route, install, later, close: () => setOpen(false) };
}
