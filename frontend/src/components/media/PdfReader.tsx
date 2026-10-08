import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, Minus, Plus, X } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// The legacy build: it carries the polyfills older phones still need.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfReaderProps {
  /** Where the PDF bytes are fetched from (same origin, through /api). */
  url: string;
  /** Absent for visitors: the full file is for members. */
  downloadUrl?: string;
  title: string;
  /** Visitor mode: `url` serves a free excerpt; its end invites to create an account to read on. */
  excerpt?: { onSignUp: () => void; onSignIn: () => void };
  /** Remembers the last page read on this device. */
  storageKey: string;
  onClose: () => void;
}

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const MAX_WIDTH = 880;

function readPage(key: string) {
  try { return Number(localStorage.getItem(key)) || 1; } catch { return 1; }
}
function savePage(key: string, page: number) {
  try { localStorage.setItem(key, String(page)); } catch { /* storage blocked: resuming is a convenience */ }
}

/**
 * A full-screen reader for PDF ebooks, drawn with pdf.js so it works the same everywhere
 * (Android's browser shows no PDF inside a page). Pages are drawn as they come into view and
 * released when far away, so a 300-page book does not exhaust a phone's memory.
 */
export default function PdfReader({ url, downloadUrl, title, excerpt, storageKey, onClose }: PdfReaderProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [progress, setProgress] = useState(0);
  const [failure, setFailure] = useState(false);
  const [ratios, setRatios] = useState<number[]>([]);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(MAX_WIDTH);
  const [page, setPage] = useState(1);
  const [jump, setJump] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const canvases = useRef(new Map<number, HTMLCanvasElement>());
  const tasks = useRef(new Map<number, RenderTask>());
  const drawn = useRef(new Set<number>());
  const resumed = useRef(false);
  // The whole book's length, when only an excerpt is loaded.
  const [fullLength, setFullLength] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loading: ReturnType<typeof pdfjs.getDocument> | null = null;
    const open = async () => {
      if (excerpt) {
        // Fetched by hand: the excerpt's response says how long the whole book is.
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(String(response.status));
        setFullLength(Number(response.headers.get('X-Total-Pages')) || null);
        loading = pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()), isEvalSupported: false });
      } else {
        loading = pdfjs.getDocument({ url, isEvalSupported: false });
        loading.onProgress = ({ loaded, total }: { loaded: number; total: number }) => { if (total) setProgress(Math.round((loaded / total) * 100)); };
      }
      const pdf = await loading.promise;
      if (cancelled) return;
      const first = await pdf.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      setRatios(Array.from({ length: pdf.numPages }, () => viewport.height / viewport.width));
      setDoc(pdf);
    };
    open().catch(() => { if (!cancelled) setFailure(true); });
    return () => {
      cancelled = true;
      void loading?.destroy();
    };
  }, [url, excerpt ? 'excerpt' : 'full']); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit to the reading column: the screen width on a phone, a comfortable page on a desktop.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.min(MAX_WIDTH, entry.contentRect.width - 32)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.round(width * zoom);

  const draw = useCallback(async (number: number) => {
    const canvas = canvases.current.get(number);
    if (!doc || !canvas || drawn.current.has(number)) return;
    drawn.current.add(number);
    try {
      const pdfPage = await doc.getPage(number);
      const base = pdfPage.getViewport({ scale: 1 });
      const ratio = base.height / base.width;
      setRatios((list) => (Math.abs((list[number - 1] ?? 0) - ratio) > 0.001 ? list.map((value, i) => (i === number - 1 ? ratio : value)) : list));
      const scale = (pageWidth / base.width) * Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) return;
      tasks.current.get(number)?.cancel();
      const task = pdfPage.render({ canvasContext: context, viewport });
      tasks.current.set(number, task);
      await task.promise;
    } catch {
      drawn.current.delete(number);
    }
  }, [doc, pageWidth]);

  const release = useCallback((number: number) => {
    tasks.current.get(number)?.cancel();
    tasks.current.delete(number);
    const canvas = canvases.current.get(number);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    drawn.current.delete(number);
  }, []);

  // A zoom change redraws everything at the new size.
  useEffect(() => {
    for (const number of [...drawn.current]) release(number);
  }, [pageWidth, release]);

  // Draw what is near the viewport, release what is far from it.
  useEffect(() => {
    const root = scroller.current;
    if (!doc || !root) return;
    const near = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const number = Number((entry.target as HTMLElement).dataset.page);
        if (entry.isIntersecting) void draw(number);
        else release(number);
      }
    }, { root, rootMargin: '1200px 0px' });
    const current = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => Number((entry.target as HTMLElement).dataset.page));
      if (visible.length) setPage(Math.min(...visible));
    }, { root, rootMargin: '-45% 0px -45% 0px' });
    root.querySelectorAll<HTMLElement>('[data-page]').forEach((element) => { near.observe(element); current.observe(element); });
    return () => { near.disconnect(); current.disconnect(); };
  }, [doc, draw, release, pageWidth]);

  useEffect(() => { if (doc) savePage(storageKey, page); }, [doc, page, storageKey]);

  const goTo = useCallback((number: number, smooth = true) => {
    const target = scroller.current?.querySelector<HTMLElement>(`[data-page="${number}"]`);
    if (target && scroller.current) scroller.current.scrollTo({ top: target.offsetTop - 16, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Back where the reader left off, once the pages are laid out.
  useEffect(() => {
    if (!doc || resumed.current || !ratios.length) return;
    resumed.current = true;
    const saved = Math.min(readPage(storageKey), doc.numPages);
    if (saved > 1) requestAnimationFrame(() => goTo(saved, false));
  }, [doc, ratios.length, storageKey, goTo]);

  const zoomBy = useCallback((step: number) => {
    setZoom((value) => ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, ZOOMS.indexOf(value) + step))]);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).tagName === 'INPUT') return;
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goTo(Math.min(page + 1, doc?.numPages ?? page)); }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goTo(Math.max(page - 1, 1)); }
      else if (event.key === '+' || event.key === '=') zoomBy(1);
      else if (event.key === '-') zoomBy(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, page, goTo, zoomBy, onClose]);

  // The page behind must not scroll under the reader.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const total = doc?.numPages ?? 0;
  const shown = fullLength ?? total;
  const truncated = Boolean(excerpt && fullLength && fullLength > total);

  /** The member lands on the first page they have not read yet. */
  const continueAfterSignUp = (go: () => void) => { savePage(storageKey, total + 1); go(); };
  const tool = 'flex h-9 w-9 items-center justify-center rounded text-t3 transition-colors duration-150 hover:bg-noir-800 hover:text-t1 disabled:opacity-40';

  // Portaled to the body: the page's own containers create stacking contexts the site header would win.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Lecture : ${title}`} className="fixed inset-0 z-[70] flex flex-col bg-noir-950">
      <header className="flex min-h-14 items-center gap-2 border-b border-line-soft px-2 pt-[env(safe-area-inset-top)] sm:px-4">
        <button type="button" onClick={onClose} className={tool} aria-label="Fermer la lecture"><X className="h-5 w-5" aria-hidden /></button>
        <p className="min-w-0 flex-1 truncate text-sm text-t1">{title}</p>

        {total > 0 && (
          <form onSubmit={(event) => { event.preventDefault(); const n = Number(jump); if (n >= 1 && n <= total) goTo(n); setJump(''); }}
            className="flex items-center gap-1 font-mono text-xs tabular-nums text-t3">
            <button type="button" onClick={() => goTo(Math.max(page - 1, 1))} disabled={page <= 1} className={`${tool} hidden sm:flex`} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
            <label htmlFor="reader-page" className="sr-only">Aller à la page</label>
            <input id="reader-page" inputMode="numeric" value={jump} onChange={(event) => setJump(event.target.value.replace(/\D/g, ''))} placeholder={String(page)}
              className="h-8 w-12 rounded border border-line bg-transparent text-center text-t1 placeholder:text-t1 focus:border-gold-400 focus:outline-none" />
            <span>/ {shown}</span>
            <button type="button" onClick={() => goTo(Math.min(page + 1, total))} disabled={page >= total} className={`${tool} hidden sm:flex`} aria-label="Page suivante"><ChevronRight className="h-4 w-4" aria-hidden /></button>
          </form>
        )}

        <div className="hidden items-center sm:flex">
          <button type="button" onClick={() => zoomBy(-1)} disabled={zoom === ZOOMS[0]} className={tool} aria-label="Dézoomer"><Minus className="h-4 w-4" aria-hidden /></button>
          <button type="button" onClick={() => setZoom(1)} className="h-9 min-w-14 rounded px-2 font-mono text-xs tabular-nums text-t3 transition-colors duration-150 hover:bg-noir-800 hover:text-t1" title="Ajuster à la largeur">{Math.round(zoom * 100)} %</button>
          <button type="button" onClick={() => zoomBy(1)} disabled={zoom === ZOOMS[ZOOMS.length - 1]} className={tool} aria-label="Zoomer"><Plus className="h-4 w-4" aria-hidden /></button>
        </div>
        {typeof document.documentElement.requestFullscreen === 'function' && (
          <button type="button" onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => undefined)}
            className={`${tool} hidden sm:flex`} aria-label="Plein écran"><Maximize2 className="h-4 w-4" aria-hidden /></button>
        )}
        {downloadUrl
          ? <a href={downloadUrl} className={tool} aria-label="Télécharger"><Download className="h-4 w-4" aria-hidden /></a>
          : excerpt && <button type="button" onClick={() => continueAfterSignUp(excerpt.onSignUp)} className={tool} aria-label="Télécharger (compte gratuit)"><Download className="h-4 w-4" aria-hidden /></button>}
      </header>

      <div ref={scroller} className="relative flex-1 overflow-auto overscroll-contain bg-noir-900 pb-[env(safe-area-inset-bottom)]">
        {failure ? (
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <p className="text-t1">Ce document ne peut pas être affiché ici.</p>
            <p className="mt-2 text-sm text-t3">Il est peut-être protégé ou dans un format que le lecteur ne gère pas. Le téléchargement reste disponible.</p>
            {downloadUrl && <a href={downloadUrl} className="btn-primary mt-6">Télécharger<Download className="h-4 w-4" aria-hidden /></a>}
          </div>
        ) : !doc ? (
          <p role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-t3">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Ouverture du document{progress ? ` · ${progress} %` : '…'}
          </p>
        ) : (
          <ol className="flex flex-col items-center gap-4 px-4 py-6">
            {ratios.map((ratio, index) => (
              <li key={index} data-page={index + 1} className="relative bg-white shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ width: pageWidth, height: Math.round(pageWidth * ratio) }}>
                <canvas ref={(element) => { if (element) canvases.current.set(index + 1, element); else canvases.current.delete(index + 1); }}
                  className="block h-full w-full" aria-label={`Page ${index + 1}`} />
              </li>
            ))}
            {truncated && excerpt && (
              <li className="w-full max-w-[880px] rounded-lg border border-line bg-noir-950 p-6 text-center sm:p-10">
                <p className="font-mono text-xs text-gold-ink">fin de l’extrait gratuit · {total} pages sur {fullLength}</p>
                <p className="mx-auto mt-4 max-w-md text-balance font-display text-2xl font-bold leading-tight text-t1 sm:text-3xl">La suite est réservée aux membres. C’est gratuit.</p>
                <p className="mx-auto mt-3 max-w-md text-sm text-t3">Crée ton compte en quelques secondes : la lecture reprendra page {total + 1}, et tu pourras télécharger l’ebook.</p>
                <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                  <button type="button" onClick={() => continueAfterSignUp(excerpt.onSignUp)} className="btn-primary">Créer mon compte gratuit</button>
                  <button type="button" onClick={() => continueAfterSignUp(excerpt.onSignIn)} className="btn-secondary">J’ai déjà un compte</button>
                </div>
              </li>
            )}
          </ol>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-line-soft px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:hidden">
          <button type="button" onClick={() => goTo(Math.max(page - 1, 1))} disabled={page <= 1} className="btn-secondary min-h-10 px-3"><ChevronLeft className="h-4 w-4" aria-hidden />Préc.</button>
          <div className="flex items-center">
            <button type="button" onClick={() => zoomBy(-1)} disabled={zoom === ZOOMS[0]} className={tool} aria-label="Dézoomer"><Minus className="h-4 w-4" aria-hidden /></button>
            <span className="w-12 text-center font-mono text-xs tabular-nums text-t3">{Math.round(zoom * 100)} %</span>
            <button type="button" onClick={() => zoomBy(1)} disabled={zoom === ZOOMS[ZOOMS.length - 1]} className={tool} aria-label="Zoomer"><Plus className="h-4 w-4" aria-hidden /></button>
          </div>
          <button type="button" onClick={() => goTo(Math.min(page + 1, total))} disabled={page >= total} className="btn-secondary min-h-10 px-3">Suiv.<ChevronRight className="h-4 w-4" aria-hidden /></button>
        </div>
      )}
    </div>,
    document.body,
  );
}
