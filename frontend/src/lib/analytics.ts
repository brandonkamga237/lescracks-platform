type EventData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

/**
 * Sends a custom event to Umami, which records the page it happened on. The tracker only exists
 * in production (nginx injects it), so elsewhere this does nothing; it never breaks the page.
 */
export function track(event: string, data?: EventData) {
  try {
    window.umami?.track(event, data);
  } catch {
    // Analytics must never stop a click from working.
  }
}

/**
 * One listener for the links worth counting, so a new sign-up button or WhatsApp link is
 * counted without extra markup: WhatsApp, the sign-up page, and any link leaving the site
 * (a hackathon submission form, a talk on YouTube).
 */
export function trackLinkClicks() {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const url = new URL(link.href, window.location.href);
    if (url.hostname === 'chat.whatsapp.com') track('Rejoindre WhatsApp');
    else if (url.origin === window.location.origin && url.pathname === '/inscription') track('Clic créer un compte');
    else if (url.protocol.startsWith('http') && url.origin !== window.location.origin) track('Lien externe', { lien: `${url.hostname}${url.pathname}` });
  }, { capture: true });
}
