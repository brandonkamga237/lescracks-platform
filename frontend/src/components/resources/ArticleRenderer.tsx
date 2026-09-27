import type { ArticleBlock, ResourceSummary } from '@/services/types';

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
          return <code key={i} className="rounded bg-noir-800 px-1.5 py-0.5 font-mono text-[0.9em] text-gold-300">{part.slice(1, -1)}</code>;
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer"
              className="text-gold-400 underline underline-offset-4 hover:text-gold-300">
              {link[1]}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

export default function ArticleRenderer({ resource }: { resource: ResourceSummary }) {
  const body = resource.body as ArticleBody;

  if (hasHtml(body)) {
    return (
      <article
        className="prose prose-invert prose-gold max-w-none article-body"
        dangerouslySetInnerHTML={{ __html: body.html }}
      />
    );
  }

  if (!Array.isArray(body)) return <p className="text-t3">Aucun contenu pour cet article.</p>;
  const blocks = body.filter(isBlock);
  if (blocks.length === 0) return <p className="text-t3">Aucun contenu pour cet article.</p>;

  return (
    <article className="prose prose-invert prose-gold max-w-none space-y-6">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return <p key={index} className="leading-relaxed text-t2"><InlineText text={block.text} /></p>;
        }
        if (block.type === 'heading') {
          const Tag = `h${block.level}` as 'h2' | 'h3';
          return <Tag key={index} className="font-display font-semibold text-t1"><InlineText text={block.text} /></Tag>;
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="border-l-4 border-gold-400 pl-4 italic text-t2">
              <InlineText text={block.text} />
            </blockquote>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 text-t2 marker:text-gold-400">
              {block.items.map((item, j) => (
                <li key={j} className="leading-relaxed"><InlineText text={item.text} /></li>
              ))}
            </ul>
          );
        }
        if (block.type === 'image') {
          return (
            <figure key={index} className="space-y-2">
              {block.url && <img src={block.url} alt={block.alt ?? ''} className="w-full rounded-2xl" />}
              {block.caption && <figcaption className="text-center text-sm text-t3">{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === 'link') {
          return (
            <a key={index} href={block.url} target="_blank" rel="noopener noreferrer" className="inline-block text-gold-400 underline-offset-4 hover:underline">
              {block.text || block.url}
            </a>
          );
        }
        if (block.type === 'divider') {
          return <hr key={index} className="border-line" />;
        }
        return null;
      })}
    </article>
  );
}
