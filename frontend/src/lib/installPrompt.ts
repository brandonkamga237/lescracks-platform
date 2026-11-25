/** The event Chromium browsers raise when the site may be installed; not yet in the DOM typings. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((listener) => listener());

/**
 * Called once at startup, before React: Chrome raises `beforeinstallprompt` early and only once per
 * page, so a listener added by a component mounted later would miss it.
 */
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keeps Chrome's own mini-bar away: the site offers the install itself, at a better moment.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export const installPromptState = () => ({ canPrompt: deferred !== null, installed });

export function subscribeInstallPrompt(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Shows the browser's install dialog; the event can be used once, so it is dropped either way. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const event = deferred;
  deferred = null;
  notify();
  await event.prompt();
  return (await event.userChoice).outcome;
}
