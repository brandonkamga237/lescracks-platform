import { useEffect, useId, useRef, useState } from 'react';
import { Check, Facebook, Link2, Linkedin, Mail, Send, Share2, Twitter } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

interface ShareButtonProps {
  title: string;
  /** Site path (/ressources/…); turned into an absolute link on this origin. */
  path?: string;
  /** Absolute link, for content hosted elsewhere (a YouTube episode). Wins over `path`. */
  url?: string;
  /** Visible label of the button. */
  label?: string;
  /** Message sent with the link, in place of the title: "J'ai eu 82/100, à toi". */
  text?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

type Network = { name: string; icon: LucideIcon | typeof WhatsAppIcon; href: (url: string, title: string) => string };

// WhatsApp first: it is where the community lives and where most links get passed on.
const NETWORKS: Network[] = [
  { name: 'WhatsApp', icon: WhatsAppIcon, href: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}` },
  { name: 'LinkedIn', icon: Linkedin, href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { name: 'X', icon: Twitter, href: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'Facebook', icon: Facebook, href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: 'Telegram', icon: Send, href: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'E-mail', icon: Mail, href: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}` },
];

/**
 * One share control for resources, events and episodes.
 *
 * On a phone it hands over to the system share sheet, which already knows the reader's apps;
 * elsewhere it opens a small panel. The link preview people see is the backend's snapshot.
 */
export default function ShareButton({ title, path, url: absolute, label = 'Partager', text, variant = 'secondary', className = '' }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const url = absolute ?? `${window.location.origin}${path ?? window.location.pathname}`;
  const shareTitle = text ?? `${title} · LesCracks`;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', onPointer); window.removeEventListener('keydown', onKey); };
  }, [open]);

  async function trigger() {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') {
      try { await navigator.share(text ? { title, text, url } : { title: shareTitle, url }); } catch { /* the reader closed the sheet */ }
      return;
    }
    setOpen((value) => !value);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (insecure context): the link stays visible in the panel to copy by hand.
    }
  }

  return (
    <div ref={container} className={`relative ${className}`}>
      <button type="button" onClick={() => void trigger()} aria-expanded={open} aria-controls={panelId} className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} w-full`}>
        <Share2 className="h-4 w-4" aria-hidden />{label}
      </button>

      {open && (
        <div id={panelId} role="dialog" aria-label={label} className="absolute bottom-full right-0 z-50 mb-2 w-72 rounded-lg border border-line bg-card p-4 shadow-2xl sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
          <ul className="grid grid-cols-3 gap-1">
            {NETWORKS.map(({ name, icon: Icon, href }) => (
              <li key={name}>
                <a href={href(url, shareTitle)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                  className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
                  <span aria-hidden><Icon className="h-5 w-5" /></span>
                  <span className="text-[11px]">{name}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 rounded border border-line bg-noir-900 p-1 pl-3">
            <span className="min-w-0 flex-1 truncate text-xs text-t3">{url.replace(/^https?:\/\//, '')}</span>
            <button type="button" onClick={() => void copy()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded bg-gold-400 px-3 text-xs font-semibold text-black transition-colors hover:bg-gold-300">
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
