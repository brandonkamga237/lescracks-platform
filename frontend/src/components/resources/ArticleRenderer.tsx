import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, Bookmark, Check, Copy, Lightbulb } from 'lucide-react';

import { headingId } from '@/lib/articleMarkdown';
import type { ArticleBlock, CalloutTone, ResourceSummary } from '@/services/types';

type ArticleBody = { html?: string } | unknown[];

function isBlock(candidate: unknown): candidate is ArticleBlock {
  return typeof candidate === 'object' && candidate !== null && 'type' in (candidate as Record<string, unknown>);
}

function hasHtml(body: unknown): body is { html: string } {
  return typeof body === 'object' && body !== null && !Array.isArray(body) && 'html' in (body as { html?: string }) && typeof (body as { html?: string }).html === 'string';
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

/** Renders **bold**, *italic*, `code` and [label](url) marks inside a block's text. */
function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-t1">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={i} className="rounded bg-noir-800 px-1.5 py-0.5 font-mono text-[0.85em] text-gold-ink">{part.slice(1, -1)}</code>;
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer"
              className="text-gold-ink underline decoration-gold-400/40 underline-offset-4 transition-colors hover:decoration-gold-400">
              {link[1]}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

const CALLOUT: Record<CalloutTone, { label: string; icon: typeof Lightbulb; frame: string; ink: string }> = {
  tip: { label: 'Astuce', icon: Lightbulb, frame: 'border-gold-400/30 bg-gold-400/[0.06]', ink: 'text-gold-ink' },
  note: { label: 'À retenir', icon: Bookmark, frame: 'border-line bg-noir-900', ink: 'text-t1' },
  warning: { label: 'Attention', icon: AlertTriangle, frame: 'border-warning/40 bg-warning/[0.06]', ink: 'text-warning-ink' },
};

function CodeBlock({ text, language }: { text: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be refused (insecure context, permissions); the code stays selectable.
    }
  }

  return (
    <figure className="mt-8 overflow-hidden rounded-lg border border-line-soft bg-noir-900">
      <figcaption className="flex items-center justify-between border-b border-line-soft px-4 py-2">
        <span className="label">{language || 'Code'}</span>
        <button type="button" onClick={() => void copy()} className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-xs text-t3 transition-colors hover:text-t1" aria-label={copied ? 'Code copié' : 'Copier le code'}>
          {copied ? <Check className="h-3.5 w-3.5 text-success-ink" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-5 text-[0.875rem] leading-relaxed [tab-size:2]"><code className="font-mono text-t1">{text}</code></pre>
    </figure>
  );
}

/**
 * Renders a block document as a reading column — shared by the public article, the writing
 * studio's preview and the newsletter preview, so what the author sees is what ships.
 */
export function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  if (!blocks.length) return <p className="text-t3">Aucun contenu.</p>;
  return (
    // ~68 characters a line at 18px: the measure long-form reading is comfortable at.
    <div className="max-w-[42rem] text-[1.0625rem] leading-[1.75] text-t2 sm:text-lg [&>*:first-child]:mt-0">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index} className="mt-6 text-pretty"><InlineText text={block.text} /></p>;
          case 'heading':
            return block.level === 2
              ? <h2 key={index} id={headingId(block.text)} className="mt-14 scroll-mt-24 text-balance font-display text-[1.75rem] font-bold leading-[1.15] tracking-tight text-t1 sm:text-[2rem]"><InlineText text={block.text} /></h2>
              : <h3 key={index} id={headingId(block.text)} className="mt-10 scroll-mt-24 text-balance font-display text-xl font-semibold leading-snug tracking-tight text-t1 sm:text-[1.375rem]"><InlineText text={block.text} /></h3>;
          case 'quote':
            return (
              <blockquote key={index} className="mt-10 border-l-2 border-gold-400 pl-6 font-display text-xl font-medium leading-snug text-t1 sm:text-2xl">
                <InlineText text={block.text} />
              </blockquote>
            );
          case 'callout': {
            const { label, icon: Icon, frame, ink } = CALLOUT[block.tone] ?? CALLOUT.note;
            return (
              <aside key={index} className={`mt-8 rounded-lg border p-5 ${frame}`}>
                <p className={`label flex items-center gap-2 ${ink}`}><Icon className="h-4 w-4" aria-hidden />{label}</p>
                <p className="mt-2 text-base leading-relaxed text-t2"><InlineText text={block.text} /></p>
              </aside>
            );
          }
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul';
            return (
              <Tag key={index} className={`mt-6 space-y-2.5 pl-6 marker:text-gold-ink ${block.ordered ? 'list-decimal marker:font-semibold' : 'list-disc'}`}>
                {block.items.map((item, j) => <li key={j} className="pl-1.5"><InlineText text={item.text} /></li>)}
              </Tag>
            );
          }
          case 'code':
            return <CodeBlock key={index} text={block.text} language={block.language} />;
          case 'image':
            return (
              <figure key={index} className="mt-10">
                {block.url && <img src={block.url} alt={block.alt ?? ''} loading="lazy" className="w-full rounded-lg border border-line-soft" />}
                {block.caption && <figcaption className="mt-3 text-center text-sm text-t4">{block.caption}</figcaption>}
              </figure>
            );
          case 'link': {
            let host = block.url;
            try { host = new URL(block.url).hostname.replace(/^www\./, ''); } catch { /* keep the raw url */ }
            return (
              <a key={index} href={block.url} target="_blank" rel="noopener noreferrer" className="group mt-6 flex items-center justify-between gap-4 rounded-lg border border-line p-4 transition-colors hover:border-gold-400/40">
                <span className="min-w-0"><span className="block truncate font-medium text-t1 group-hover:text-gold-ink">{block.text || block.url}</span><span className="mt-0.5 block truncate text-sm text-t4">{host}</span></span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-t4 group-hover:text-gold-ink" aria-hidden />
              </a>
            );
          }
          case 'divider':
            return <hr key={index} className="mx-auto mt-12 w-24 border-line" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function ArticleRenderer({ resource }: { resource: ResourceSummary }) {
  const body = resource.body as ArticleBody;

  if (hasHtml(body)) {
    return (
      <article
        className="article-body max-w-[42rem]"
        dangerouslySetInnerHTML={{ __html: body.html }}
      />
    );
  }

  if (!Array.isArray(body)) return <p className="text-t3">Aucun contenu pour cet article.</p>;
  const blocks = body.filter(isBlock);
  if (blocks.length === 0) return <p className="text-t3">Aucun contenu pour cet article.</p>;

  return <ArticleBlocks blocks={blocks} />;
}
