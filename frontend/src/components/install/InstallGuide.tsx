import { useState } from 'react';
import { Check, Copy, Ellipsis, EllipsisVertical, ExternalLink, Share, SquarePlus, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { InstallRoute } from '@/lib/installPlatform';

interface Step {
  Icon: LucideIcon;
  text: string;
  hint?: string;
}

interface Guide {
  title: string;
  steps: Step[];
  /** The page's address to paste in another browser, when this one cannot install. */
  copyLink?: boolean;
}

// The words are those the phone shows on screen, so the reader recognises the button to tap.
const GUIDES: Partial<Record<InstallRoute, Guide>> = {
  'ios-safari': {
    title: 'Installer sur ton iPhone',
    steps: [
      { Icon: Share, text: 'Touche le bouton Partager', hint: 'En bas de Safari, ou en haut sur iPad.' },
      { Icon: SquarePlus, text: 'Choisis « Sur l’écran d’accueil »', hint: 'Fais défiler la liste si tu ne le vois pas.' },
      { Icon: Check, text: 'Touche « Ajouter »', hint: 'L’icône LesCracks apparaît sur ton écran d’accueil.' },
    ],
  },
  'ios-other': {
    title: 'Installer sur ton iPhone',
    steps: [
      { Icon: Share, text: 'Touche le bouton Partager', hint: 'Dans la barre d’adresse ou le menu de ton navigateur.' },
      { Icon: SquarePlus, text: 'Choisis « Sur l’écran d’accueil »', hint: 'Disponible depuis iOS 16.4.' },
      { Icon: ExternalLink, text: 'Tu ne le trouves pas ? Ouvre le site dans Safari', hint: 'Copie le lien ci-dessous et colle-le dans Safari, puis recommence.' },
    ],
    copyLink: true,
  },
  'android-menu': {
    title: 'Installer sur ton téléphone',
    steps: [
      { Icon: EllipsisVertical, text: 'Ouvre le menu du navigateur', hint: 'Les trois points, en haut ou en bas à droite.' },
      { Icon: SquarePlus, text: 'Choisis « Installer l’application »', hint: 'Ou « Ajouter à l’écran d’accueil », selon le navigateur.' },
      { Icon: Check, text: 'Confirme avec « Installer »', hint: 'L’icône LesCracks rejoint tes applications.' },
    ],
  },
  'in-app': {
    title: 'Ouvre d’abord ton navigateur',
    steps: [
      { Icon: Ellipsis, text: 'Touche le menu de l’application', hint: 'Les trois points en haut de l’écran (Instagram, Facebook, LinkedIn…).' },
      { Icon: ExternalLink, text: 'Choisis « Ouvrir dans le navigateur »', hint: 'Ou « Ouvrir dans Safari » / « Ouvrir dans Chrome ».' },
      { Icon: SquarePlus, text: 'Installe LesCracks depuis le navigateur', hint: 'L’invitation à installer t’y attend.' },
    ],
    copyLink: true,
  },
};

interface InstallGuideProps {
  route: InstallRoute;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The install gesture of this phone, step by step, in a sheet that rises from the bottom. */
export default function InstallGuide({ route, open, onOpenChange }: InstallGuideProps) {
  const [copied, setCopied] = useState(false);
  const guide = GUIDES[route];
  if (!guide) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent position="bottom" className="gap-0 rounded-t-3xl border-white/10 bg-noir-900 p-0">
        <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center gap-4 px-5 pb-2 pt-5">
          <img src="/icon-192.png" alt="" className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold">{guide.title}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/50">Trois gestes, sans passer par un store.</DialogDescription>
          </div>
        </div>

        <ol className="space-y-3 px-5 pt-5">
          {guide.steps.map((step, index) => (
            <li key={step.text} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-400/10 text-gold-400">
                <step.Icon className="h-5 w-5" aria-hidden="true" />
                <span aria-hidden="true" className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-[11px] font-semibold text-black">{index + 1}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium leading-snug">{step.text}</span>
                {step.hint && <span className="mt-1 block text-sm leading-relaxed text-white/50">{step.hint}</span>}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex gap-3 border-t border-white/10 px-5 pb-1 pt-4">
          {guide.copyLink && (
            <Button type="button" variant="outline" size="lg" onClick={() => void copy()} className="flex-1 whitespace-nowrap px-4">
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? 'Lien copié' : 'Copier le lien'}
            </Button>
          )}
          <Button type="button" size="lg" onClick={() => onOpenChange(false)} className="flex-1 whitespace-nowrap px-4 font-semibold">J’ai compris</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
