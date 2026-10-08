import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, CalendarClock, Check, AlertCircle, Columns2, Eye, ListTree, Loader2, Monitor,
  PenLine, Settings2, Smartphone, AlertTriangle, X,
} from 'lucide-react';

import { htmlToBlocks } from '@/components/admin/BlockEditor';
import ScheduleDialog from '@/components/admin/ScheduleDialog';
import ArticlePreview from '@/components/admin/studio/ArticlePreview';
import MarkdownEditor from '@/components/admin/studio/MarkdownEditor';
import SEO from '@/components/common/SEO';
import { useApi } from '@/hooks/useApi';
import { checkArticle } from '@/lib/articleChecks';
import { articleStats, blocksToMarkdown, headingId, markdownToBlocks } from '@/lib/articleMarkdown';
import { formatScheduleLong, formatScheduleShort } from '@/lib/schedule';
import { resourcePath } from '@/lib/slugs';
import { adminApi, type ArticleRequest } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { ArticleBlock, ResourceStatus, ResourceSummary, Tag } from '@/services/types';

type Mode = 'write' | 'split' | 'preview';

interface Draft {
  title: string;
  description: string;
  markdown: string;
  categoryId: number | '';
  tagIds: number[];
}

const EMPTY: Draft = { title: '', description: '', markdown: '', categoryId: '', tagIds: [] };

// A local copy survives a crash, a closed tab or an expired session; it is never the source of truth.
const draftKey = (id?: number) => `lescracks.studio.${id ?? 'new'}`;
function readLocal(key: string): (Draft & { savedAt: number }) | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeLocal(key: string, draft: Draft) {
  try { localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() })); } catch { /* storage full or blocked */ }
}
function clearLocal(key: string) {
  try { localStorage.removeItem(key); } catch { /* storage blocked */ }
}

function isBlock(candidate: unknown): candidate is ArticleBlock {
  return typeof candidate === 'object' && candidate !== null && 'type' in candidate;
}

function bodyToMarkdown(body: unknown): string {
  if (Array.isArray(body)) return blocksToMarkdown(body.filter(isBlock));
  if (body && typeof body === 'object' && typeof (body as { html?: unknown }).html === 'string') return blocksToMarkdown(htmlToBlocks((body as { html: string }).html));
  return '';
}

const sameDraft = (a: Draft, b: Draft) => a.title === b.title && a.description === b.description && a.markdown === b.markdown
  && a.categoryId === b.categoryId && a.tagIds.join() === b.tagIds.join();

/** Pixel offset of a character inside a wrapping textarea, measured on an invisible twin. */
function caretTop(area: HTMLTextAreaElement, offset: number): number {
  const mirror = document.createElement('div');
  const style = getComputedStyle(area);
  ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderWidth', 'boxSizing', 'tabSize']
    .forEach((prop) => { mirror.style.setProperty(prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), style.getPropertyValue(prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))); });
  Object.assign(mirror.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', width: `${area.clientWidth}px`, top: '0', left: '-9999px' });
  mirror.textContent = area.value.slice(0, offset);
  document.body.appendChild(mirror);
  const top = mirror.scrollHeight;
  mirror.remove();
  return top;
}

/** Grows a textarea with its content; called on every render so a narrower column re-measures it. */
function grow(area: HTMLTextAreaElement | null) {
  if (!area) return;
  area.style.height = 'auto';
  area.style.height = `${area.scrollHeight}px`;
}

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * The writing studio: a full-screen page for long-form articles.
 *
 * Written in Markdown, stored as blocks (the backend never sees Markdown), previewed with the
 * exact renderer readers get. A local copy is kept while typing; the server is only written
 * when the author saves.
 */
export default function ArticleStudio() {
  const { id } = useParams();
  const articleId = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const invalidId = Boolean(id) && articleId === undefined;
  const location = useLocation();
  const navigate = useNavigate();
  const passed = (location.state as { resource?: ResourceSummary } | null)?.resource;

  const [resource, setResource] = useState<ResourceSummary | null>(passed && passed.id === articleId ? passed : null);
  const [loadError, setLoadError] = useState(invalidId ? 'Cet article est introuvable.' : '');
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<Draft>(EMPTY);
  const [ready, setReady] = useState(!articleId && !invalidId);
  const [restorable, setRestorable] = useState<(Draft & { savedAt: number }) | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('split');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [busy, setBusy] = useState<'save' | 'publish' | 'unpublish' | 'schedule' | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [failure, setFailure] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [tagsMatched, setTagsMatched] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const key = draftKey(articleId);

  // Refreshing on /admin/articles/:id has no router state: find the article in the admin list.
  useEffect(() => {
    if (!articleId || resource) return;
    const controller = new AbortController();
    adminApi.resources({ kind: 'ARTICLE', size: 200 }, controller.signal)
      .then((page) => {
        const found = page.content.find((item) => item.id === articleId);
        if (found) setResource(found);
        else setLoadError('Cet article est introuvable. Il a peut-être été supprimé.');
      })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : 'Impossible de charger l’article.'); });
    return () => controller.abort();
  }, [articleId, resource]);

  useEffect(() => {
    if (ready || !resource) return;
    const fromServer: Draft = { title: resource.title, description: resource.description, markdown: bodyToMarkdown(resource.body), categoryId: resource.categoryId, tagIds: [] };
    setDraft(fromServer);
    setSaved(fromServer);
    setReady(true);
  }, [resource, ready]);

  // Offer the local copy once, when it differs from what the server holds.
  useEffect(() => {
    if (!ready) return;
    const local = readLocal(key);
    if (local && !sameDraft({ ...local, tagIds: local.tagIds ?? [] }, saved)) setRestorable(local);
    // Only on arrival: later saves rewrite the local copy themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => (draft.categoryId ? api.tags(Number(draft.categoryId), signal) : Promise.resolve([] as Tag[])), [draft.categoryId]);

  // The API returns tag names; map them to ids once the category's tags are known.
  useEffect(() => {
    if (tagsMatched || !resource || !tags.data || draft.categoryId !== resource.categoryId) return;
    const names = new Set(resource.tags ?? []);
    const ids = tags.data.filter((tag) => names.has(tag.name)).map((tag) => tag.id);
    setDraft((value) => ({ ...value, tagIds: ids }));
    setSaved((value) => ({ ...value, tagIds: ids }));
    setTagsMatched(true);
  }, [resource, tags.data, draft.categoryId, tagsMatched]);

  const dirty = ready && (!sameDraft(draft, saved) || coverFile !== null);

  useEffect(() => {
    if (!ready || !dirty) return;
    const timer = window.setTimeout(() => writeLocal(key, draft), 600);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, ready, key]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => () => { if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl); }, [coverObjectUrl]);

  // The preview, outline and checks follow a deferred copy so typing never waits on rendering.
  const deferredMarkdown = useDeferredValue(draft.markdown);
  const blocks = useMemo(() => markdownToBlocks(deferredMarkdown), [deferredMarkdown]);
  const stats = useMemo(() => articleStats(blocks), [blocks]);
  const hasCover = Boolean(coverFile || resource?.coverImage);
  const checks = useMemo(() => checkArticle({ ...draft, hasCover, blocks, words: stats.words }), [draft, hasCover, blocks, stats.words]);
  const blocking = checks.filter((check) => check.level === 'blocking');
  const advice = checks.filter((check) => check.level === 'advice');
  const outline = blocks.flatMap((block, index) => (block.type === 'heading' ? [{ index, level: block.level, text: block.text }] : []));
  const status: ResourceStatus = resource?.status ?? 'DRAFT';
  const scheduledAt = status === 'DRAFT' ? resource?.scheduledAt : undefined;
  const categoryName = categories.data?.find((category) => category.id === draft.categoryId)?.name;
  const coverUrl = coverObjectUrl ?? resource?.coverImage ?? null;

  const update = (patch: Partial<Draft>) => setDraft((value) => ({ ...value, ...patch }));

  /** A plain save keeps the current schedule; publishing now, or passing null, cancels it. */
  async function save(target: ResourceStatus, schedule: string | null = target === 'DRAFT' ? scheduledAt ?? null : null) {
    if (busy || !ready) return;
    setFailure('');
    if (blocking.length) {
      setFailure(blocking[0].message);
      if (!hasCover || !draft.categoryId) setSettingsOpen(true);
      return;
    }
    setBusy(schedule !== (scheduledAt ?? null) ? 'schedule' : target === status ? 'save' : target === 'PUBLISHED' ? 'publish' : 'unpublish');
    const data: ArticleRequest = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      coverImage: resource?.coverImage ?? '',
      categoryId: Number(draft.categoryId),
      tagIds: draft.tagIds,
      status: target,
      scheduledAt: schedule,
      body: markdownToBlocks(draft.markdown),
    };
    try {
      const result = resource
        ? await adminApi.updateArticle(resource.id, data, coverFile ?? undefined)
        : await adminApi.createArticle(data, coverFile!);
      clearLocal(key);
      setSaved(draft);
      setCoverFile(null);
      setCoverObjectUrl(null);
      setResource(result);
      setSavedAt(new Date());
      setRestorable(null);
      setScheduling(false);
      if (!resource) navigate(`/admin/articles/${result.id}`, { replace: true, state: { resource: result } });
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’enregistrement a échoué. Ta copie locale est conservée, réessaie.');
    } finally {
      setBusy(null);
    }
  }

  function jumpTo(entry: { text: string; level: 2 | 3; index: number }) {
    const area = textareaRef.current;
    const nth = outline.filter((item) => item.text === entry.text && item.index < entry.index).length;
    const pattern = new RegExp(`^#{${entry.level === 3 ? 3 : '1,2'}}\\s+${entry.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm');
    const matches = [...draft.markdown.matchAll(pattern)];
    const offset = matches[nth]?.index;
    if (area && offset !== undefined && mode !== 'preview') {
      area.focus({ preventScroll: true });
      area.setSelectionRange(offset, offset);
      area.scrollTop = Math.max(0, caretTop(area, offset) - 80);
    }
    const preview = previewRef.current;
    const target = preview?.querySelectorAll<HTMLElement>(`[id="${headingId(entry.text)}"]`)[nth];
    if (preview && target) preview.scrollTop = Math.max(0, target.offsetTop - 24);
  }

  function chooseCover(file: File | null) {
    setCoverFile(file);
    setCoverObjectUrl(file ? URL.createObjectURL(file) : null);
  }

  function leave(event: React.MouseEvent) {
    if (dirty && !window.confirm('Des modifications ne sont pas encore enregistrées sur le serveur. Une copie reste sur cet appareil. Quitter le studio ?')) event.preventDefault();
  }

  const saveLabel = busy ? 'Enregistrement…'
    : dirty ? 'Modifications non enregistrées'
      : savedAt ? `Enregistré à ${timeFormat.format(savedAt)}`
        : resource ? (status === 'PUBLISHED' ? 'Publié · à jour' : scheduledAt ? 'Programmé · à jour' : 'Brouillon · à jour') : 'Nouvel article';

  if (loadError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-black px-6 text-center text-t1">
        <p className="font-display text-2xl font-bold">{loadError}</p>
        <Link to="/admin/ressources" className="btn-secondary"><ArrowLeft className="h-4 w-4" aria-hidden />Retour aux ressources</Link>
      </div>
    );
  }

  if (!ready) {
    return <div role="status" className="flex min-h-[100dvh] items-center justify-center gap-3 bg-black text-t3"><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />Ouverture du studio…</div>;
  }

  const modeButton = (value: Mode, label: string, Icon: typeof PenLine, extra = '') => (
    <button type="button" onClick={() => setMode(value)} aria-pressed={mode === value}
      className={`inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors ${extra} ${mode === value ? 'bg-noir-700 text-t1' : 'text-t3 hover:text-t1'}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />{label}
    </button>
  );

  const editor = (
    <section aria-label="Écriture" className={`flex min-h-0 min-w-0 flex-col ${mode === 'split' ? 'lg:flex-1 lg:border-r lg:border-line-soft' : 'mx-auto w-full max-w-[56rem]'} ${mode === 'preview' ? 'hidden' : 'flex-1'}`}>
      <div className="px-5 pt-8 sm:px-10">
        <label htmlFor="studio-title" className="sr-only">Titre de l’article</label>
        <textarea id="studio-title" ref={(el) => grow(el)} rows={1} value={draft.title} onChange={(event) => { update({ title: event.target.value.replace(/\n/g, ' ') }); grow(event.target); }}
          placeholder="Titre de l’article" maxLength={200}
          className="w-full resize-none bg-transparent font-display text-3xl font-bold leading-tight tracking-tight text-t1 placeholder:text-t4 focus:outline-none sm:text-4xl" />
        <label htmlFor="studio-lead" className="sr-only">Chapô</label>
        <textarea id="studio-lead" ref={(el) => grow(el)} rows={2} value={draft.description} onChange={(event) => { update({ description: event.target.value }); grow(event.target); }}
          placeholder="Chapô : deux ou trois phrases qui donnent envie de lire la suite. Il sert aussi de résumé dans la bibliothèque et les partages."
          className="mt-3 w-full resize-none bg-transparent text-lg leading-relaxed text-t2 placeholder:text-t4 focus:outline-none" />
      </div>
      <MarkdownEditor
        value={draft.markdown}
        onChange={(markdown) => update({ markdown })}
        onSave={() => void save(status)}
        textareaRef={textareaRef}
        onScrollRatio={(ratio) => {
          const preview = previewRef.current;
          if (mode === 'split' && preview) preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
        }}
      />
    </section>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-black text-t1">
      <SEO title={draft.title ? `${draft.title} · Studio` : 'Studio d’écriture'} description="Écrire un article LesCracks." url="/admin/articles" />

      <header className="mode-raised flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line-soft px-3 py-2 sm:px-4">
        <Link to="/admin/ressources" onClick={leave} className="inline-flex h-9 items-center gap-1.5 rounded px-2 text-sm text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
          <ArrowLeft className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Ressources</span>
        </Link>
        <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-semibold text-t1">Studio</span>
          <span role="status" className={`hidden truncate md:inline ${dirty ? 'text-warning-ink' : 'text-t4'}`}>{saveLabel}</span>
        </p>

        <div className="ml-auto flex items-center gap-2">
          <div role="group" aria-label="Affichage" className="hidden items-center rounded border border-line p-0.5 sm:flex">
            {modeButton('write', 'Écrire', PenLine)}
            {modeButton('split', 'Côte à côte', Columns2, 'hidden lg:inline-flex')}
            {modeButton('preview', 'Aperçu', Eye)}
          </div>
          <span className="hidden text-xs tabular-nums text-t4 xl:inline">{stats.words.toLocaleString('fr-FR')} mots · {stats.minutes} min</span>
          <button type="button" onClick={() => setSideOpen((open) => !open)} aria-pressed={sideOpen} title="Plan et qualité"
            className={`hidden h-9 items-center gap-1.5 rounded px-2.5 text-sm transition-colors hover:bg-noir-800 xl:inline-flex ${sideOpen ? 'text-t1' : 'text-t3'}`}>
            <ListTree className="h-4 w-4" aria-hidden />Plan
          </button>
          <button type="button" onClick={() => setSettingsOpen((open) => !open)} aria-pressed={settingsOpen} aria-controls="studio-settings"
            className={`relative inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-sm transition-colors hover:bg-noir-800 ${settingsOpen ? 'text-t1' : 'text-t3'}`}>
            <Settings2 className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Réglages</span>
            {(!hasCover || !draft.categoryId) && <span aria-label="à compléter" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold-400" />}
          </button>
          {status === 'PUBLISHED'
            ? <button type="button" disabled={!!busy} onClick={() => void save('DRAFT')} className="btn-secondary hidden md:inline-flex">{busy === 'unpublish' ? 'Dépublication…' : 'Dépublier'}</button>
            : <>
              <button type="button" disabled={!!busy} onClick={() => void save('DRAFT')} className="btn-secondary">{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button type="button" disabled={!!busy} onClick={() => setScheduling(true)} title={scheduledAt ? `Publication automatique le ${formatScheduleLong(scheduledAt)}` : 'Choisir une date de publication'}
                className={`inline-flex h-10 items-center gap-1.5 rounded border px-3 text-sm transition-colors ${scheduledAt ? 'border-dashed border-gold-400/60 text-gold-ink hover:bg-gold-400/10' : 'border-line text-t2 hover:bg-noir-800 hover:text-t1'}`}>
                <CalendarClock className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">{scheduledAt ? formatScheduleShort(scheduledAt) : 'Programmer'}</span>
              </button>
            </>}
          <button type="button" disabled={!!busy} onClick={() => void save('PUBLISHED')} className="btn-primary">
            {busy === 'publish' ? 'Publication…' : status === 'PUBLISHED' ? (busy === 'save' ? 'Mise à jour…' : 'Mettre à jour') : 'Publier'}
          </button>
        </div>
      </header>

      {restorable && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gold-400/30 bg-gold-400/[0.06] px-4 py-2.5 text-sm">
          <p className="text-t1">Une version non enregistrée du {dayFormat.format(new Date(restorable.savedAt))} a été retrouvée sur cet appareil.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setDraft({ ...EMPTY, ...restorable, tagIds: restorable.tagIds ?? [] }); setRestorable(null); }} className="font-semibold text-gold-ink underline-offset-4 hover:underline">Restaurer</button>
            <button type="button" onClick={() => { clearLocal(key); setRestorable(null); }} className="text-t3 underline-offset-4 hover:text-t1 hover:underline">Ignorer</button>
          </div>
        </div>
      )}
      {failure && (
        <div role="alert" className="flex items-center gap-3 border-b border-error/30 bg-error/10 px-4 py-2.5 text-sm text-t1">
          <AlertCircle className="h-4 w-4 shrink-0 text-error-ink" aria-hidden /><p className="flex-1">{failure}</p>
          <button type="button" onClick={() => setFailure('')} aria-label="Fermer le message" className="flex h-8 w-8 items-center justify-center rounded text-t3 hover:text-t1"><X className="h-4 w-4" aria-hidden /></button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {sideOpen && (
          <aside aria-label="Plan et qualité" className={`hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-line-soft px-4 py-6 ${settingsOpen ? '2xl:flex' : 'xl:flex'}`}>
            <p className="label px-2">Plan</p>
            {outline.length ? (
              <ol className="mt-3 space-y-0.5">
                {outline.map((entry) => (
                  <li key={entry.index}>
                    <button type="button" onClick={() => jumpTo(entry)}
                      className={`w-full truncate rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-noir-800 hover:text-t1 ${entry.level === 3 ? 'pl-5 text-t4' : 'text-t2'}`}>
                      {entry.text.replace(/[*`]/g, '')}
                    </button>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 px-2 text-sm leading-relaxed text-t4">Les intertitres (##) apparaîtront ici.</p>}

            <p className="label mt-8 px-2">Qualité</p>
            <ul className="mt-3 space-y-2 px-2 text-sm">
              {checks.length === 0 && <li className="flex gap-2 text-success-ink"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Prêt à publier.</li>}
              {blocking.map((check) => <li key={check.message} className="flex gap-2 text-t1"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-ink" aria-hidden />{check.message}</li>)}
              {advice.map((check) => <li key={check.message} className="flex gap-2 text-t3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" aria-hidden />{check.message}</li>)}
            </ul>
            <p className="mt-auto px-2 pt-8 text-xs leading-relaxed text-t4">{stats.words.toLocaleString('fr-FR')} mots · {stats.minutes} min de lecture. Raccourcis : Ctrl+S enregistrer, Ctrl+B gras, Ctrl+I italique, Ctrl+K lien.</p>
          </aside>
        )}

        {editor}

        {mode !== 'write' && (
          <section aria-label="Aperçu" className={`relative min-h-0 min-w-0 flex-1 flex-col ${mode === 'split' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-1.5">
              <span className="label">Aperçu fidèle à la page publique</span>
              <div role="group" aria-label="Appareil" className="flex items-center gap-0.5">
                <button type="button" onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'} aria-label="Aperçu ordinateur" title="Ordinateur"
                  className={`flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-noir-800 ${device === 'desktop' ? 'text-gold-ink' : 'text-t3'}`}><Monitor className="h-4 w-4" aria-hidden /></button>
                <button type="button" onClick={() => setDevice('mobile')} aria-pressed={device === 'mobile'} aria-label="Aperçu mobile" title="Mobile"
                  className={`flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-noir-800 ${device === 'mobile' ? 'text-gold-ink' : 'text-t3'}`}><Smartphone className="h-4 w-4" aria-hidden /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ArticlePreview ref={previewRef} title={draft.title} description={draft.description} coverUrl={coverUrl} categoryName={categoryName} minutes={stats.minutes} blocks={blocks} device={device} />
            </div>
          </section>
        )}

        {settingsOpen && (
          <aside id="studio-settings" aria-label="Réglages de l’article" className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-card lg:static lg:z-auto lg:w-80 lg:shrink-0 lg:border-l lg:border-line-soft">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
              <p className="font-display text-lg font-bold text-t1">Réglages</p>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Fermer les réglages" className="flex h-9 w-9 items-center justify-center rounded text-t3 hover:bg-noir-800 hover:text-t1"><X className="h-4 w-4" aria-hidden /></button>
            </div>
            <div className="space-y-7 px-5 py-6">
              <div>
                <p className="text-sm font-medium text-t1">Couverture</p>
                <div className="mt-2 aspect-[16/9] overflow-hidden rounded border border-line bg-noir-800">
                  {coverUrl ? <img src={coverUrl} alt="Couverture de l’article" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-t4">Aucune couverture</div>}
                </div>
                <label className="btn-secondary mt-3 w-full cursor-pointer">
                  {coverUrl ? 'Changer l’image' : 'Choisir une image'}
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => chooseCover(event.target.files?.[0] ?? null)} />
                </label>
                <p className="mt-2 text-xs leading-relaxed text-t4">Format paysage 16:9 conseillé, au moins 1600 px de large.</p>
              </div>

              <label className="block text-sm font-medium text-t1">Catégorie
                <select value={draft.categoryId} disabled={categories.loading || !!categories.error}
                  onChange={(event) => update({ categoryId: event.target.value ? Number(event.target.value) : '', tagIds: [] })} className="input mt-2">
                  <option value="">Choisir une catégorie</option>
                  {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>

              {draft.categoryId !== '' && (
                <div>
                  <p className="text-sm font-medium text-t1">Sujets</p>
                  {tags.data?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.data.map((tag) => {
                        const on = draft.tagIds.includes(tag.id);
                        return (
                          <button key={tag.id} type="button" aria-pressed={on}
                            onClick={() => update({ tagIds: on ? draft.tagIds.filter((tagId) => tagId !== tag.id) : [...draft.tagIds, tag.id] })}
                            className={`min-h-9 rounded border px-3 text-xs transition-colors ${on ? 'border-gold-400 bg-gold-400/10 text-gold-ink' : 'border-line text-t3 hover:text-t1'}`}>
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : <p className="mt-2 text-xs text-t4">{tags.loading ? 'Chargement…' : <>Aucun sujet pour cette catégorie. <Link to="/admin/tags" className="text-gold-ink underline">Créer un sujet</Link>.</>}</p>}
                </div>
              )}

              <div className="border-t border-line-soft pt-6 text-sm">
                <p className="font-medium text-t1">Visibilité</p>
                <p className="mt-1 text-t3">{status === 'PUBLISHED' ? 'Publié : visible par tout le monde.' : scheduledAt ? `Programmé : en ligne automatiquement le ${formatScheduleLong(scheduledAt)}.` : 'Brouillon : visible uniquement dans l’administration.'}</p>
                {resource && status === 'PUBLISHED' && (
                  <a href={resourcePath(resource)} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-flex items-center gap-1.5">Voir l’article publié<ArrowUpRight className="h-4 w-4" aria-hidden /></a>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <ScheduleDialog open={scheduling} onOpenChange={setScheduling} current={scheduledAt} busy={busy === 'schedule'} subject="cet article"
        onConfirm={(value) => void save('DRAFT', value)} onUnschedule={() => void save('DRAFT', null)} />
    </div>
  );
}
