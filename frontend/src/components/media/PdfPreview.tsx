import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, X } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// The legacy build: it carries the polyfills older phones still need.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfPreviewProps {
  /** The preview endpoint: the first pages, with the book's length in X-Total-Pages. */
  url: string;
  title: string;
  /** The way to the whole book: a download for members, an account first for visitors. */
  action: { label: string; busy?: boolean; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  onClose: () => void;
}

const MAX_WIDTH = 820;

/**
 * Leafs through an ebook's first pages before downloading it. Drawn with pdf.js so it looks the
 * same everywhere, Android included, where a browser shows no PDF inside a page.
 */
export default function PdfPreview({ url, title, action, secondary, onClose }: PdfPreviewProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [length, setLength] = useState<number | null>(null);
  const [failure, setFailure] = useState(false);
  const [width, setWidth] = useState(MAX_WIDTH);
  const scroller = useRef<HTMLDivElement>(null);
  const canvases = useRef(new Map<number, HTMLCanvasElement>());

  useEffect(() => {
    let cancelled = false;
    let loading: ReturnType<typeof pdfjs.getDocument> | null = null;
    (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      setLength(Number(response.headers.get('X-Total-Pages')) || null);
      loading = pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()), isEvalSupported: false });
      const pdf = await loading.promise;
      if (!cancelled) setDoc(pdf);
    })().catch(() => { if (!cancelled) setFailure(true); });
    return () => { cancelled = true; void loading?.destroy(); };
  }, [url]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.min(MAX_WIDTH, entry.contentRect.width - 32)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A handful of pages: all drawn at once, redrawn when the width changes.
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      for (let number = 1; number <= doc.numPages && !cancelled; number++) {
        const canvas = canvases.current.get(number);
        if (!canvas) continue;
        const page = await doc.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * Math.min(window.devicePixelRatio || 1, 2) });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext('2d');
        if (context) await page.render({ canvasContext: context, viewport }).promise;
      }
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, [doc, width]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [onClose]);

  const pages = doc?.numPages ?? 0;
  const more = length && length > pages ? length - pages : 0;
  const download = (
    <button type="button" onClick={action.onClick} disabled={action.busy} className="btn-primary">
      {action.busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}{action.busy ? 'Téléchargement…' : action.label}
    </button>
  );

  // Portaled to the body: the page's own containers create stacking contexts the site header would win.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Aperçu : ${title}`} className="fixed inset-0 z-[70] flex flex-col bg-noir-950">
      <header className="flex min-h-14 items-center gap-3 border-b border-line-soft px-2 pt-[env(safe-area-inset-top)] sm:px-4">
        <button type="button" onClick={onClose} aria-label="Fermer l’aperçu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-t3 transition-colors hover:bg-noir-800 hover:text-t1"><X className="h-5 w-5" aria-hidden /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-t1">{title}</p>
          {pages > 0 && <p className="font-mono text-[11px] text-t4">aperçu · {pages} {pages > 1 ? 'pages' : 'page'}{length ? ` sur ${length}` : ''}</p>}
        </div>
        <div className="hidden sm:block">{download}</div>
      </header>

      <div ref={scroller} className="flex-1 overflow-auto overscroll-contain bg-noir-900">
        {failure ? (
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <p className="text-t1">L’aperçu de ce document n’est pas disponible.</p>
            <p className="mt-2 text-sm text-t3">Le téléchargement, lui, fonctionne.</p>
            <div className="mt-6">{download}</div>
          </div>
        ) : !doc ? (
          <p role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-t3">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Préparation de l’aperçu…
          </p>
        ) : (
          <ol className="mx-auto flex flex-col items-center gap-4 px-4 py-6">
            {Array.from({ length: pages }, (_, index) => (
              <li key={index} className="w-full max-w-[820px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <canvas ref={(element) => { if (element) canvases.current.set(index + 1, element); else canvases.current.delete(index + 1); }}
                  className="block h-auto w-full" aria-label={`Page ${index + 1}`} />
              </li>
            ))}
            <li className="w-full max-w-[820px] rounded-lg border border-line bg-noir-950 p-6 text-center sm:p-10">
              <p className="font-mono text-xs text-gold-ink">fin de l’aperçu{more ? ` · encore ${more} pages` : ''}</p>
              <p className="mx-auto mt-4 max-w-md text-balance font-display text-2xl font-bold leading-tight text-t1 sm:text-3xl">La suite est dans l’ebook.</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-t3">Télécharge-le pour le lire en entier, à ton rythme, même hors connexion.</p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                {download}
                {secondary && <button type="button" onClick={secondary.onClick} className="btn-secondary">{secondary.label}</button>}
              </div>
            </li>
          </ol>
        )}
      </div>

      <div className="border-t border-line-soft px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:hidden [&>button]:w-full">{download}</div>
    </div>,
    document.body,
  );
}
