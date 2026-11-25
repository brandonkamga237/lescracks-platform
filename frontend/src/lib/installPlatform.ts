/**
 * How a phone can install the site as an app, read from the browser it is in. Each platform has its
 * own gesture: Android browsers raise an install prompt (or keep it in their menu), iOS only adds to
 * the home screen from the share sheet, and the browsers built into social apps cannot install at all.
 */
export type InstallRoute =
  /** Already opened from the home screen: nothing to offer. */
  | 'installed'
  /** A computer: the invitation is for phones. */
  | 'desktop'
  /** Android browser that raised `beforeinstallprompt`: one button installs. */
  | 'android-prompt'
  /** Android browser without the prompt (Firefox, or before Chrome raises it): its menu installs. */
  | 'android-menu'
  /** Safari on iPhone or iPad: Share, then "Sur l'écran d'accueil". */
  | 'ios-safari'
  /** Another iOS browser (Chrome, Firefox, Edge): its own share button, or Safari. */
  | 'ios-other'
  /** A browser inside Instagram, Facebook, LinkedIn…: it must open the page in a real browser first. */
  | 'in-app';

export interface InstallContext {
  userAgent: string;
  /** `navigator.maxTouchPoints`: an iPad reports itself as a Mac, its touch screen gives it away. */
  touchPoints: number;
  standalone: boolean;
  canPrompt: boolean;
}

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|musical_ly|BytedanceWebview|Line\//i;
const IOS_OTHER_BROWSER = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//;

export function isIos(userAgent: string, touchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}

export function installRoute({ userAgent, touchPoints, standalone, canPrompt }: InstallContext): InstallRoute {
  if (standalone) return 'installed';
  const ios = isIos(userAgent, touchPoints);
  const android = /Android/i.test(userAgent);
  if (!ios && !android) return 'desktop';
  if (IN_APP.test(userAgent)) return 'in-app';
  if (ios) return IOS_OTHER_BROWSER.test(userAgent) ? 'ios-other' : 'ios-safari';
  return canPrompt ? 'android-prompt' : 'android-menu';
}

/** Opened from the home screen: the display mode says so, and iOS Safari also flags it on navigator. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || ['standalone', 'fullscreen', 'minimal-ui'].some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);
}
