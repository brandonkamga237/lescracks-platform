import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Bold, ChevronDown, ChevronUp, Code, Heading1, Heading2, ImagePlus,
  Italic, Link2, List, Minus, Plus, Quote, Trash2, Type,
} from 'lucide-react';

import { adminApi } from '@/services/adminApi';
import type { ArticleBlock } from '@/services/types';

interface BlockEditorProps {
  value: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}

/** Lets the host page drop a token (a {{variable}}, a snippet) where the writer's cursor is. */
export interface BlockEditorHandle {
  insertText: (token: string) => void;
}

type MenuInsert =
  | { kind: 'paragraph' } | { kind: 'heading'; level?: 2 | 3 } | { kind: 'quote' }
  | { kind: 'list' } | { kind: 'image' } | { kind: 'link' } | { kind: 'divider' };

const MENU: { kind: MenuInsert['kind']; level?: 2 | 3; label: string; hint: string; icon: typeof Type }[] = [
  { kind: 'paragraph', label: 'Texte', hint: 'Un paragraphe simple', icon: Type },
  { kind: 'heading', level: 2, label: 'Grand titre', hint: 'Une section de l’article', icon: Heading1 },
  { kind: 'heading', level: 3, label: 'Sous-titre', hint: 'Une sous-section', icon: Heading2 },
  { kind: 'quote', label: 'Citation', hint: 'Un passage mis en avant', icon: Quote },
  { kind: 'list', label: 'Liste', hint: 'Une ligne par élément', icon: List },
  { kind: 'image', label: 'Image', hint: 'Envoyée sur la plateforme', icon: ImagePlus },
  { kind: 'link', label: 'Lien', hint: 'Un lien externe mis en avant', icon: Link2 },
  { kind: 'divider', label: 'Séparateur', hint: 'Une pause visuelle', icon: Minus },
];

function emptyBlock(insert: MenuInsert): ArticleBlock {
  switch (insert.kind) {
    case 'heading': return { type: 'heading', level: insert.level ?? 2, text: '' };
    case 'quote': return { type: 'quote', text: '' };
    case 'list': return { type: 'list', items: [{ text: '' }] };
    case 'image': return { type: 'image', url: '' };
    case 'link': return { type: 'link', url: '', text: '' };
    case 'divider': return { type: 'divider' };
    default: return { type: 'paragraph', text: '' };
  }
}

/** Wraps the current textarea selection with an inline mark. */
function wrap(textarea: HTMLTextAreaElement | HTMLInputElement, before: string, after = before) {
  const { value } = textarea;
  const start = textarea.selectionStart ?? value.length;
  const end = textarea.selectionEnd ?? value.length;
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  return { next };
}

/** Roughly converts a legacy { html } body into blocks so old articles open in the editor. */
export function htmlToBlocks(html: string): ArticleBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: ArticleBlock[] = [];
  doc.body.querySelectorAll('h1,h2,h3,h4,p,blockquote,ul,hr').forEach((node) => {
    const text = node.textContent?.trim() ?? '';
    if (node.tagName === 'HR') blocks.push({ type: 'divider' });
    else if (node.tagName === 'UL') {
      const items = Array.from(node.querySelectorAll('li')).map((li) => ({ text: li.textContent?.trim() ?? '' })).filter((i) => i.text);
      if (items.length) blocks.push({ type: 'list', items });
    } else if (!text) return;
    else if (node.tagName.startsWith('H')) blocks.push({ type: 'heading', level: node.tagName === 'H1' || node.tagName === 'H2' ? 2 : 3, text });
    else if (node.tagName === 'BLOCKQUOTE') blocks.push({ type: 'quote', text });
    else blocks.push({ type: 'paragraph', text });
  });
  return blocks;
}

const AREA = 'w-full resize-none border-0 bg-transparent p-0 text-t1 placeholder:text-t4 focus:outline-none focus:ring-0';

const BlockEditor = forwardRef<BlockEditorHandle, BlockEditorProps>(function BlockEditor({ value, onChange }, ref) {
  const blocks = value;
  const [focus, setFocusState] = useState(-1);
  const focusRef = useRef(-1);
  const setFocus = (index: number) => {
    focusRef.current = index;
    setFocusState(index);
  };
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<number | null>(null);
  const refs = useRef(new Map<number, HTMLTextAreaElement | HTMLInputElement>());

  useImperativeHandle(ref, () => ({
    insertText: (token: string) => {
      // No focus: drop the token at the end of the last text block.
      const index = focusRef.current >= 0 ? focusRef.current
        : blocks.reduce((last, b, i) => ('text' in b ? i : last), -1);
      const area = refs.current.get(index);
      const block = blocks[index];
      if (!block || !('text' in block)) return;
      const start = area ? (area.selectionStart ?? block.text.length) : block.text.length;
      const end = area ? (area.selectionEnd ?? start) : start;
      update(index, { ...block, text: block.text.slice(0, start) + token + block.text.slice(end) });
      requestAnimationFrame(() => area?.focus());
    },
  }));

  const setRef = (index: number) => (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    if (el) {
      refs.current.set(index, el);
      if (el instanceof HTMLTextAreaElement) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    } else {
      refs.current.delete(index);
    }
  };

  const update = (index: number, block: ArticleBlock) =>
    onChange(blocks.map((b, i) => (i === index ? block : b)));

  const insert = (index: number, insert: MenuInsert) => {
    const next = emptyBlock(insert);
    const current = blocks[index];
    if (current && 'text' in current && current.text === '/') {
      update(index, next);
      setMenuAt(null);
      requestAnimationFrame(() => refs.current.get(index)?.focus());
      return;
    }
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, next);
    onChange(nextBlocks);
    setMenuAt(null);
    requestAnimationFrame(() => refs.current.get(index + 1)?.focus());
  };

  const remove = (index: number) => {
    const nextBlocks = blocks.filter((_, i) => i !== index);
    onChange(nextBlocks.length ? nextBlocks : [{ type: 'paragraph', text: '' }]);
    requestAnimationFrame(() => refs.current.get(Math.max(0, index - 1))?.focus());
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const nextBlocks = [...blocks];
    [nextBlocks[index], nextBlocks[target]] = [nextBlocks[target], nextBlocks[index]];
    onChange(nextBlocks);
  };

  const applyMark = (index: number, before: string, after = before) => {
    const area = refs.current.get(index);
    const block = blocks[index];
    if (!area || !('text' in block)) return;
    const { next } = wrap(area, before, after);
    update(index, { ...block, text: next });
    requestAnimationFrame(() => area.focus());
  };

  const applyLink = (index: number, url: string) => {
    const area = refs.current.get(index);
    const block = blocks[index];
    if (!area || !('text' in block) || !url.trim()) return;
    const { next } = wrap(area, '[', `](${url.trim()})`);
    update(index, { ...block, text: next });
    setLinkFor(null);
    requestAnimationFrame(() => area.focus());
  };

  const onTextKey = (index: number, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const block = blocks[index];
    if (!('text' in block)) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (block.type === 'heading' || block.type === 'quote') insert(index, { kind: 'paragraph' });
      else insert(index, { kind: 'paragraph' });
    }
    if (event.key === 'Backspace' && !block.text && blocks.length > 1) {
      event.preventDefault();
      remove(index);
    }
    if (event.key === 'Escape') setMenuAt(null);
  };

  const onTextChange = (index: number, text: string) => {
    const block = blocks[index];
    if (!('text' in block)) return;
    update(index, { ...block, text });
    if (text === '/' && block.type === 'paragraph') setMenuAt(index);
    else if (menuAt === index && !text.startsWith('/')) setMenuAt(null);
  };

  const grow = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const textArea = (index: number, block: { text: string }, classes: string, placeholder: string) => (
    <div className="relative">
      <textarea
        ref={setRef(index)}
        rows={1}
        value={block.text}
        placeholder={placeholder}
        onFocus={() => setFocus(index)}
        onBlur={() => setFocus(-1)}
        onChange={(e) => { onTextChange(index, e.target.value); grow(e); }}
        onKeyDown={(e) => onTextKey(index, e)}
        onInput={grow}
        className={`${AREA} ${classes}`}
      />
    </div>
  );

  const toolbar = (index: number) => (
    <div className="absolute -top-10 left-0 z-20 flex items-center gap-0.5 rounded-full border border-line bg-noir-900 px-1.5 py-1 shadow-xl">
      {[
        { icon: Bold, label: 'Gras', mark: '**' },
        { icon: Italic, label: 'Italique', mark: '*' },
        { icon: Code, label: 'Code', mark: '`' },
      ].map(({ icon: Icon, label, mark }) => (
        <button key={label} type="button" title={label} aria-label={label}
          onMouseDown={(e) => { e.preventDefault(); applyMark(index, mark); }}
          className="rounded-full p-1.5 text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
      <button type="button" title="Lien" aria-label="Lien"
        onMouseDown={(e) => { e.preventDefault(); setLinkFor(index); }}
        className="rounded-full p-1.5 text-t3 transition-colors hover:bg-noir-800 hover:text-t1">
        <Link2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );

  const blockShell = (index: number, children: React.ReactNode, textBlock = true) => {
    const active = focus === index;
    return (
      <div key={index} className="group relative flex gap-3">
        <div className={`flex w-8 shrink-0 flex-col items-center pt-1.5 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button type="button" title="Insérer un bloc" aria-label="Insérer un bloc après celui-ci"
            onClick={() => setMenuAt(menuAt === index ? null : index)}
            className="rounded-full border border-line p-1 text-t3 transition-colors hover:border-gold-400/50 hover:text-gold-400">
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <div className="mt-1 flex flex-col">
            <button type="button" aria-label="Monter" onClick={() => move(index, -1)}
              className="p-0.5 text-t4 hover:text-t1 disabled:opacity-20" disabled={index === 0}>
              <ChevronUp className="h-3 w-3" aria-hidden />
            </button>
            <button type="button" aria-label="Descendre" onClick={() => move(index, 1)}
              className="p-0.5 text-t4 hover:text-t1 disabled:opacity-20" disabled={index === blocks.length - 1}>
              <ChevronDown className="h-3 w-3" aria-hidden />
            </button>
            <button type="button" aria-label="Supprimer le bloc" onClick={() => remove(index)}
              className="p-0.5 text-t4 hover:text-error-ink">
              <Trash2 className="h-3 w-3" aria-hidden />
            </button>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {active && textBlock && toolbar(index)}
          {children}
        </div>
        {menuAt === index && (
          <ul role="menu" className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-2xl border border-line bg-noir-900 shadow-2xl">
            {MENU.map(({ kind, level, label, hint, icon: Icon }) => (
              <li key={label}>
                <button type="button" role="menuitem" onClick={() => insert(index, { kind, level })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-noir-800">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-gold-400">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-t1">{label}</span>
                    <span className="block text-xs text-t4">{hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderBlock = (block: ArticleBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        return blockShell(index, textArea(index, block,
          block.level === 2 ? 'font-display text-3xl font-semibold' : 'font-display text-2xl font-semibold',
          block.level === 2 ? 'Grand titre' : 'Sous-titre'));
      case 'quote':
        return blockShell(index, (
          <div className="border-l-2 border-gold-400 pl-5">
            {textArea(index, block, 'text-xl italic text-t2', 'Une citation qui mérite d’être lue')}
          </div>
        ));
      case 'list':
        return blockShell(index, (
          <div className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" aria-hidden />
            <textarea
              rows={Math.max(2, block.items.length)}
              value={block.items.map((i) => i.text).join('\n')}
              placeholder="Un élément par ligne"
              onFocus={() => setFocus(index)}
              onBlur={() => setFocus(-1)}
              onChange={(e) => update(index, { type: 'list', items: e.target.value.split('\n').map((text) => ({ text })) })}
              className={`${AREA} leading-8`}
            />
          </div>
        ), false);
      case 'image':
        return blockShell(index, (
          <figure className="space-y-3">
            {block.url ? (
              <img src={block.url} alt={block.alt ?? ''} className="w-full rounded-2xl border border-line" />
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-10 text-t3 transition-colors hover:border-gold-400/40 hover:text-t1">
                <ImagePlus className="h-6 w-6 text-gold-400" aria-hidden />
                <span className="text-sm">Ajouter une image</span>
                <input type="file" accept="image/*" className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const uploaded = await adminApi.uploadImage(file);
                    update(index, { ...block, url: uploaded.url });
                  }} />
              </label>
            )}
            {block.url && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input ref={setRef(index)} value={block.alt ?? ''} placeholder="Texte alternatif"
                  onFocus={() => setFocus(index)} onBlur={() => setFocus(-1)}
                  onChange={(e) => update(index, { ...block, alt: e.target.value })}
                  className="input text-xs" />
                <input value={block.caption ?? ''} placeholder="Légende (facultatif)"
                  onFocus={() => setFocus(index)} onBlur={() => setFocus(-1)}
                  onChange={(e) => update(index, { ...block, caption: e.target.value })}
                  className="input text-xs" />
              </div>
            )}
          </figure>
        ), false);
      case 'link':
        return blockShell(index, (
          <div className="grid gap-2 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <input value={block.text} placeholder="Texte du lien"
              onFocus={() => setFocus(index)} onBlur={() => setFocus(-1)}
              onChange={(e) => update(index, { ...block, text: e.target.value })}
              className="input text-sm" />
            <input value={block.url} type="url" placeholder="https://…"
              onFocus={() => setFocus(index)} onBlur={() => setFocus(-1)}
              onChange={(e) => update(index, { ...block, url: e.target.value })}
              className="input text-sm" />
          </div>
        ), false);
      case 'divider':
        return blockShell(index, (
          <div className="flex items-center gap-4 py-2" onFocus={() => setFocus(index)} tabIndex={0}>
            <span className="h-px flex-1 bg-line" aria-hidden />
            <Minus className="h-3.5 w-3.5 text-t4" aria-hidden />
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
        ), false);
      default:
        return blockShell(index, textArea(index, block, 'text-lg leading-relaxed', 'Raconte quelque chose…'));
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-noir-950/40 px-4 py-6 sm:px-8">
      {linkFor !== null && (
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('url') as HTMLInputElement;
            applyLink(linkFor, input.value);
          }}
        >
          <input name="url" type="url" required autoFocus placeholder="https://…"
            className="input flex-1 text-sm" />
          <button type="submit" className="rounded-full bg-gold-400 px-4 text-sm font-semibold text-black">Ajouter</button>
          <button type="button" onClick={() => setLinkFor(null)} className="rounded-full border border-line px-4 text-sm text-t3">Annuler</button>
        </form>
      )}
      <div className="space-y-1">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
      <button type="button" onClick={() => insert(blocks.length - 1, { kind: 'paragraph' })}
        className="mt-4 inline-flex items-center gap-2 text-sm text-t4 transition-colors hover:text-gold-400">
        <Plus className="h-4 w-4" aria-hidden /> Ajouter un bloc
      </button>
      <p className="mt-4 text-xs leading-relaxed text-t4">
        Astuce — tape <kbd className="rounded bg-noir-800 px-1.5 py-0.5">/</kbd> dans un paragraphe vide pour choisir un bloc,
        sélectionne du texte pour le mettre en forme, <kbd className="rounded bg-noir-800 px-1.5 py-0.5">Entrée</kbd> crée un nouveau bloc.
      </p>
    </div>
  );
});

export default BlockEditor;
