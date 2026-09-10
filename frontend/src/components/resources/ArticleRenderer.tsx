import type { ResourceSummary } from '@/services/types';

type ArticleBody = { html?: string } | Array<unknown>;

type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; url: string; alt?: string; caption?: string }
  | { type: 'link'; url: string; text: string }
  | { type: 'divider' };

function isBlock(candidate: unknown): candidate is ArticleBlock {
  return typeof candidate === 'object' && candidate !== null && 'type' in (candidate as Record<string, unknown>);
}

function hasHtml(body: unknown): body is { html: string } {
  return typeof body === 'object' && body !== null && !Array.isArray(body) && 'html' in (body as { html?: string }) && typeof (body as { html?: string }).html === 'string';
}

function isBlockArray(body: unknown): body is ArticleBlock[] {
  return Array.isArray(body);
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

  if (!isBlockArray(body)) return <p className="text-t3">Aucun contenu pour cet article.</p>;
  const blocks = body.filter(isBlock);
  if (blocks.length === 0) return <p className="text-t3">Aucun contenu pour cet article.</p>;

  return (
    <article className="prose prose-invert prose-gold max-w-none space-y-6">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return <p key={index} className="leading-relaxed text-t2">{block.text}</p>;
        }
        if (block.type === 'heading') {
          const Tag = `h${block.level}` as 'h2' | 'h3';
          return <Tag key={index} className="font-display font-semibold text-t1">{block.text}</Tag>;
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="border-l-4 border-gold-400 pl-4 italic text-t2">
              {block.text}
            </blockquote>
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
