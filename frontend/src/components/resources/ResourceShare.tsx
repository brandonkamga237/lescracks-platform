import { useEffect, useRef, useState } from 'react';
import { Check, Facebook, Link2, Linkedin, Mail, Share2, Twitter, X, type LucideIcon } from 'lucide-react';

import { resourcePath } from '@/lib/slugs';
import type { ResourceSummary } from '@/services/types';

interface ResourceShareProps {
  resource: Pick<ResourceSummary, 'id' | 'slug' | 'title'>;
  compact?: boolean;
}

const NETWORKS: { name: string; icon: LucideIcon; href: (url: string, title?: string) => string }[] = [
  { name: 'Twitter', icon: Twitter, href: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}${title ? `&text=${encodeURIComponent(title)}` : ''}` },
  { name: 'LinkedIn', icon: Linkedin, href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { name: 'Facebook', icon: Facebook, href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: 'Email', icon: Mail, href: (url, title) => `mailto:?subject=${encodeURIComponent(title ?? '')}&body=${encodeURIComponent(url)}` },
];

export default function ResourceShare({ resource, compact = false }: ResourceShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const title = resource.title;
  const url = `${window.location.origin}${resourcePath(resource)}`;

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  async function copy(event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore on unsupported contexts.
    }
  }

  async function nativeShare(event: React.MouseEvent) {
    event.stopPropagation();
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, url }); setOpen(false); } catch { /* cancelled */ }
    }
  }

  return (
    <div ref={container} className="relative inline-block">
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); setOpen((v) => !v); }}
        className={`inline-flex items-center justify-center rounded-full border border-line bg-black/60 text-t3 backdrop-blur-sm transition hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Partager"
      >
        <Share2 className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-line-soft bg-card p-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-line-soft pb-2">
            <span className="text-sm font-medium text-t1">Partager</span>
            <button type="button" onClick={(event) => { event.stopPropagation(); setOpen(false); }} className="rounded p-1 text-t3 hover:text-t1" aria-label="Fermer"><X className="h-3.5 w-3.5" aria-hidden /></button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {NETWORKS.map(({ name, icon: Icon, href }) => (
              <a
                key={name}
                href={href(url, title)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-t3 transition hover:bg-white/5 hover:text-t1"
                aria-label={`Partager sur ${name}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="text-[10px]">{name}</span>
              </a>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {typeof navigator.share === 'function' && (
              <button type="button" onClick={nativeShare} className="w-full rounded-xl border border-line-soft py-2 text-sm text-t2 transition hover:bg-white/5">
                Partager nativement
              </button>
            )}
            <button type="button" onClick={copy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400/10 py-2 text-sm font-medium text-gold-400 transition hover:bg-gold-400/20">
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
              {copied ? 'Lien copié' : 'Copier le lien'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
