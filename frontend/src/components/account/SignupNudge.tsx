import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

import { useSession } from '@/hooks/useSession';

const VIEWS = 'lescracks.nudge.views';
const SHOWN = 'lescracks.nudge.shown';
const SNOOZED = 'lescracks.nudge.snoozedUntil';
const WEEK = 7 * 24 * 3600 * 1000;
const QUIET_PATHS = ['/connexion', '/inscription', '/bienvenue', '/reinitialiser', '/verifier-email'];

function read(storage: Storage, key: string) {
  try { return storage.getItem(key); } catch { return null; }
}
function write(storage: Storage, key: string, value: string) {
  try { storage.setItem(key, value); } catch { /* storage blocked: the card simply never shows */ }
}

/**
 * One invitation to create an account, for visitors who are clearly interested: on their third
 * page, never during reading, at most once per visit, and silent for a week after « Plus tard ».
 */
export default function SignupNudge() {
  const { pathname, search } = useLocation();
  const { isLoading, isSignedIn, socialSignIn } = useSession();
  const [open, setOpen] = useState(false);
  const reading = new URLSearchParams(search).has('lecture');

  useEffect(() => {
    if (isLoading || isSignedIn || QUIET_PATHS.some((path) => pathname.startsWith(path))) return;
    const views = Number(read(sessionStorage, VIEWS) ?? '0') + 1;
    write(sessionStorage, VIEWS, String(views));
    const snoozed = Number(read(localStorage, SNOOZED) ?? '0') > Date.now();
    if (views < 3 || snoozed || read(sessionStorage, SHOWN)) return;
    // A moment on the page first: the card must not cover what was just opened.
    const timer = window.setTimeout(() => { setOpen(true); write(sessionStorage, SHOWN, '1'); }, 4000);
    return () => window.clearTimeout(timer);
  }, [pathname, isLoading, isSignedIn]);

  if (!open || isSignedIn || reading) return null;

  function later() {
    write(localStorage, SNOOZED, String(Date.now() + WEEK));
    setOpen(false);
  }

  const from = `${pathname}${search}`;
  return (
    <aside aria-labelledby="nudge-title"
      className="fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 rounded-lg border border-line-strong bg-noir-900 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] sm:inset-x-auto sm:left-4 sm:w-96 lg:bottom-4">
      <button type="button" onClick={later} aria-label="Fermer" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded text-t4 transition-colors hover:text-t1"><X className="h-4 w-4" aria-hidden /></button>
      <p id="nudge-title" className="pr-8 font-medium text-t1">Crée ton compte gratuit</p>
      <p className="mt-1.5 text-sm leading-relaxed text-t3">Les ebooks en entier et en téléchargement, les challenges CrackLab et les ateliers. Dix secondes avec Google.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => void socialSignIn('google', from)} className="btn-primary flex-1">Continuer avec Google</button>
        <Link to="/inscription" state={{ from }} onClick={() => setOpen(false)} className="btn-secondary flex-1">Avec mon email</Link>
      </div>
      <button type="button" onClick={later} className="mt-3 text-xs text-t4 underline-offset-4 hover:text-t2 hover:underline">Plus tard</button>
    </aside>
  );
}
