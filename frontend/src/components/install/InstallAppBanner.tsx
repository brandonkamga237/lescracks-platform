import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import InstallGuide from '@/components/install/InstallGuide';
import { Button } from '@/components/ui/button';
import { useInstallNudge } from '@/hooks/useInstallApp';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface InstallAppBannerProps {
  member: boolean;
  /** The platform's phone tab bar sits at the bottom: the card rests just above it. */
  aboveTabBar?: boolean;
}

/** The invitation to install LesCracks on a phone still reading it in the browser. */
export default function InstallAppBanner({ member, aboveTabBar = false }: InstallAppBannerProps) {
  const { open, route, install, later, close } = useInstallNudge(member);
  const [guide, setGuide] = useState(false);
  const inApp = route === 'in-app';

  async function act() {
    if (route === 'android-prompt') {
      const accepted = await install();
      if (accepted) close();
      return;
    }
    setGuide(true);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            aria-labelledby="install-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={cn(
              'fixed inset-x-3 z-50 rounded-3xl border border-white/10 bg-noir-900/95 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:hidden',
              aboveTabBar ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(0.75rem+env(safe-area-inset-bottom))]',
            )}
          >
            <button type="button" onClick={later} aria-label="Plus tard" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-white/40 transition-colors hover:text-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3 pr-8">
              <img src="/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl" />
              <div className="min-w-0">
                <p id="install-title" className="font-semibold leading-tight">{inApp ? 'Ouvre LesCracks dans ton navigateur' : 'L’appli LesCracks'}</p>
                <p className="mt-0.5 text-sm leading-snug text-white/55">{inApp ? 'Pour l’installer sur ton téléphone.' : 'Plein écran, ouverte en un tap depuis ton écran d’accueil.'}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={later} className="flex-1 text-white/60">Plus tard</Button>
              <Button type="button" size="sm" onClick={() => void act()} className="flex-[2] font-semibold">{inApp ? 'Comment faire' : 'Installer'}</Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <InstallGuide route={route} open={guide} onOpenChange={(next) => { setGuide(next); if (!next) close(); }} />
    </>
  );
}
