import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  Bold, Code, HelpCircle, FileCode2, Heading2, Heading3, ImagePlus, Italic, Lightbulb,
  Link2, List, ListOrdered, Loader2, Minus, Quote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  /** Scroll position as a 0–1 ratio, so the preview can follow. */
  onScrollRatio?: (ratio: number) => void;
}

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

/**
 * Replaces the selection through the browser's own editing command so Ctrl+Z still works;
 * falls back to setRangeText where execCommand is gone.
 */
function replaceSelection(area: HTMLTextAreaElement, text: string) {
  area.focus();
  if (!document.execCommand('insertText', false, text)) {
    area.setRangeText(text, area.selectionStart, area.selectionEnd, 'end');
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function lineBounds(value: string, start: number, end: number) {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  const next = value.indexOf('\n', end);
  return { from, to: next === -1 ? value.length : next };
}

const SYNTAX: [string, string][] = [
  ['## Section', 'Intertitre (### pour un sous-titre)'],
  ['**gras**  *italique*', 'Mise en valeur'],
  ['`code`', 'Code dans une phrase'],
  ['[texte](https://…)', 'Lien'],
  ['- élément  /  1. élément', 'Liste à puces / numérotée'],
  ['> citation', 'Citation mise en avant'],
  ['> [!TIP]  [!NOTE]  [!WARNING]', 'Encadré Astuce / À retenir / Attention'],
  ['```bash … ```', 'Bloc de code avec son langage'],
  ['![description](url "légende")', 'Image (ou glisse-la dans l’éditeur)'],
  ['---', 'Séparateur'],
];

export default function MarkdownEditor({ value, onChange, onSave, textareaRef, onScrollRatio }: MarkdownEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const area = () => textareaRef.current;

  function wrap(before: string, after: string, placeholder: string) {
    const el = area();
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = el.value.slice(s, e) || placeholder;
    replaceSelection(el, `${before}${selected}${after}`);
    el.setSelectionRange(s + before.length, s + before.length + selected.length);
  }

  /** Adds a prefix to every selected line, or removes it when all lines already carry it. */
  function prefixLines(prefix: (index: number) => string, pattern: RegExp) {
    const el = area();
    if (!el) return;
    const { from, to } = lineBounds(el.value, el.selectionStart, el.selectionEnd);
    const lines = el.value.slice(from, to).split('\n');
    const all = lines.every((line) => pattern.test(line));
    const next = lines.map((line, i) => (all ? line.replace(pattern, '') : `${prefix(i)}${line.replace(pattern, '')}`)).join('\n');
    el.setSelectionRange(from, to);
    replaceSelection(el, next);
    el.setSelectionRange(from, from + next.length);
  }

  function heading(level: 2 | 3) {
    const el = area();
    if (!el) return;
    const { from, to } = lineBounds(el.value, el.selectionStart, el.selectionStart);
    const line = el.value.slice(from, to);
    const marks = '#'.repeat(level);
    const stripped = line.replace(/^#{1,6}\s+/, '');
    const next = line.startsWith(`${marks} `) ? stripped : `${marks} ${stripped}`;
    el.setSelectionRange(from, to);
    replaceSelection(el, next);
    el.setSelectionRange(from + next.length, from + next.length);
  }

  /** Inserts a block on its own paragraph and selects `select` inside it. */
  function insertBlock(text: string, select?: string) {
    const el = area();
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart);
    const after = el.value.slice(el.selectionEnd);
    const lead = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    const trail = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
    const start = el.selectionStart + lead.length;
    replaceSelection(el, `${lead}${text}${trail}`);
    const at = select ? text.indexOf(select) : -1;
    if (at >= 0) el.setSelectionRange(start + at, start + at + select!.length);
    else el.setSelectionRange(start + text.length, start + text.length);
  }

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    setUploadError('');
    try {
      const { url } = await adminApi.uploadImage(file);
      insertBlock(`![Décris l’image](${url})`, 'Décris l’image');
    } catch (error) {
      setUploadError(error instanceof ApiError ? error.message : 'L’envoi de l’image a échoué. Réessaie.');
    } finally {
      setUploading(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && !event.shiftKey && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === 's') { event.preventDefault(); onSave(); return; }
      if (key === 'b') { event.preventDefault(); wrap('**', '**', 'texte en gras'); return; }
      if (key === 'i') { event.preventDefault(); wrap('*', '*', 'texte en italique'); return; }
      if (key === 'k') { event.preventDefault(); wrap('[', '](https://)', 'texte du lien'); return; }
      if (key === 'e') { event.preventDefault(); wrap('`', '`', 'code'); return; }
    }

    // Enter continues a list or a quote; on an empty item it ends it, like every editor people know.
    if (event.key === 'Enter' && !event.shiftKey && !mod) {
      const el = event.currentTarget;
      if (el.selectionStart !== el.selectionEnd) return;
      const { from } = lineBounds(el.value, el.selectionStart, el.selectionStart);
      const line = el.value.slice(from, el.selectionStart);
      const list = line.match(/^(\s*)([-*+]|(\d+)[.)])\s+(.*)$/);
      const quote = line.match(/^>\s?(.*)$/);
      if (list) {
        event.preventDefault();
        if (!list[4].trim()) { el.setSelectionRange(from, el.selectionStart); replaceSelection(el, ''); return; }
        const marker = list[3] ? `${Number(list[3]) + 1}.` : list[2];
        replaceSelection(el, `\n${list[1]}${marker} `);
      } else if (quote) {
        event.preventDefault();
        if (!quote[1].trim()) { el.setSelectionRange(from, el.selectionStart); replaceSelection(el, ''); return; }
        replaceSelection(el, '\n> ');
      }
    }
  }

  const tools: ({ icon: LucideIcon; label: string; run: () => void } | 'sep')[] = [
    { icon: Heading2, label: 'Intertitre (##)', run: () => heading(2) },
    { icon: Heading3, label: 'Sous-titre (###)', run: () => heading(3) },
    'sep',
    { icon: Bold, label: `Gras (${MOD}+B)`, run: () => wrap('**', '**', 'texte en gras') },
    { icon: Italic, label: `Italique (${MOD}+I)`, run: () => wrap('*', '*', 'texte en italique') },
    { icon: Code, label: `Code dans le texte (${MOD}+E)`, run: () => wrap('`', '`', 'code') },
    { icon: Link2, label: `Lien (${MOD}+K)`, run: () => wrap('[', '](https://)', 'texte du lien') },
    'sep',
    { icon: List, label: 'Liste à puces', run: () => prefixLines(() => '- ', /^\s*[-*+]\s+/) },
    { icon: ListOrdered, label: 'Liste numérotée', run: () => prefixLines((i) => `${i + 1}. `, /^\s*\d+[.)]\s+/) },
    { icon: Quote, label: 'Citation', run: () => prefixLines(() => '> ', /^>\s?/) },
    { icon: Lightbulb, label: 'Encadré (astuce, à retenir, attention)', run: () => insertBlock('> [!TIP]\n> Ton astuce ici.', 'Ton astuce ici.') },
    { icon: FileCode2, label: 'Bloc de code', run: () => insertBlock('```bash\ncommande\n```', 'commande') },
    { icon: ImagePlus, label: 'Image', run: () => fileRef.current?.click() },
    { icon: Minus, label: 'Séparateur', run: () => insertBlock('---') },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap items-center gap-0.5 border-b border-line-soft px-2 py-1.5">
        {tools.map((tool, index) => tool === 'sep'
          ? <span key={index} aria-hidden className="mx-1 h-5 w-px bg-line" />
          : (
            <button key={tool.label} type="button" onClick={tool.run} title={tool.label} aria-label={tool.label}
              className="flex h-9 w-9 items-center justify-center rounded text-t3 transition-colors hover:bg-noir-800 hover:text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
              <tool.icon className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ))}
        {uploading && <span role="status" className="ml-2 inline-flex items-center gap-1.5 text-xs text-t3"><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />Envoi de l’image…</span>}
        <button type="button" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen} aria-controls="markdown-help"
          className={`ml-auto flex h-9 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors hover:bg-noir-800 ${helpOpen ? 'text-gold-ink' : 'text-t3 hover:text-t1'}`}>
          <HelpCircle className="h-4 w-4" aria-hidden />Syntaxe
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden
          onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
      </div>

      {helpOpen && (
        <dl id="markdown-help" className="grid gap-x-6 gap-y-2 border-b border-line-soft bg-noir-900 px-5 py-4 text-sm sm:grid-cols-2">
          {SYNTAX.map(([code, meaning]) => (
            <div key={code} className="flex flex-col">
              <dt className="font-mono text-[0.8125rem] text-gold-ink">{code}</dt>
              <dd className="text-t3">{meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      {uploadError && <p role="alert" className="border-b border-line-soft px-5 py-2 text-sm text-error-ink">{uploadError}</p>}

      <label htmlFor="studio-body" className="sr-only">Corps de l’article, en Markdown</label>
      <textarea
        id="studio-body"
        ref={textareaRef}
        value={value}
        spellCheck
        lang="fr"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(event) => {
          const el = event.currentTarget;
          const range = el.scrollHeight - el.clientHeight;
          onScrollRatio?.(range > 0 ? el.scrollTop / range : 0);
        }}
        onPaste={(event) => {
          const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'));
          if (file) { event.preventDefault(); void upload(file); }
        }}
        onDragOver={(event) => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); }}
        onDrop={(event) => {
          const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'));
          if (file) { event.preventDefault(); void upload(file); }
        }}
        placeholder={'Commence à écrire…\n\n## pour un intertitre, ``` pour du code, > [!TIP] pour un encadré.\nColle ou glisse une image pour l’envoyer.'}
        className="min-h-0 w-full flex-1 resize-none bg-transparent px-5 py-6 font-mono text-[0.9375rem] leading-[1.85] text-t1 caret-gold-400 placeholder:text-t4 focus:outline-none sm:px-10 [tab-size:2]"
      />
    </div>
  );
}
