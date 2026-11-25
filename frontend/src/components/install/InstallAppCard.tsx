import { useState } from 'react';
import { Smartphone } from 'lucide-react';

import InstallGuide from '@/components/install/InstallGuide';
import { Button } from '@/components/ui/button';
import { useInstallApp } from '@/hooks/useInstallApp';

/** A standing way to install the app from the profile, for a member who said "Plus tard" to the invitation. */
export default function InstallAppCard() {
  const { route, install } = useInstallApp();
  const [guide, setGuide] = useState(false);
  if (route === 'installed' || route === 'desktop') return null;

  return (
    <section aria-labelledby="install-card-title" className="flex items-center gap-4 rounded-3xl border border-gold-400/20 bg-gold-400/[0.05] p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-400"><Smartphone className="h-5 w-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <h2 id="install-card-title" className="font-semibold">L’appli LesCracks</h2>
        <p className="mt-0.5 text-sm text-white/55">Sur ton écran d’accueil, en plein écran.</p>
      </div>
      <Button type="button" size="sm" className="shrink-0 font-semibold" onClick={() => void (route === 'android-prompt' ? install() : setGuide(true))}>Installer</Button>
      <InstallGuide route={route} open={guide} onOpenChange={setGuide} />
    </section>
  );
}
