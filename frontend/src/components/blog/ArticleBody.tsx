/**
 * Renders the block document an article is stored as.
 *
 * Deliberately small and forgiving: a block whose type nobody has taught it yet is skipped
 * rather than thrown on, because a reader losing one paragraph is better than a reader
 * losing the page. Unknown types are logged in development so they get added.
 */

interface Block {
  type?: string;
  text?: string;
  level?: number;
  caption?: string;
  alt?: string;
  url?: string;
  mediaId?: number;
  content?: Block[];
}

const HEADINGS: Record<number, 'h2' | 'h3' | 'h4'> = { 1: 'h2', 2: 'h3', 3: 'h4' };

function renderBlock(block: Block, key: string): React.ReactNode {
  switch (block.type) {
    case 'doc':
      return <div key={key}>{(block.content ?? []).map((c, i) => renderBlock(c, `${key}.${i}`))}</div>;

    case 'heading': {
      const Tag = HEADINGS[block.level ?? 1] ?? 'h3';
      return (
        <Tag key={key} className="mt-12 font-display text-2xl font-semibold text-t1">
          {block.text}
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p key={key} className="mt-5 leading-relaxed text-t2">
          {block.text}
        </p>
      );

    case 'quote':
      return (
        <blockquote key={key} className="mt-8 border-l-2 border-gold-400 pl-5 text-lg italic text-t2">
          {block.text}
        </blockquote>
      );

    case 'code':
      return (
        <pre key={key} className="mt-6 overflow-x-auto rounded border border-line-soft bg-card p-4">
          <code className="font-mono text-sm text-t2">{block.text}</code>
        </pre>
      );

    case 'list':
      return (
        <ul key={key} className="mt-5 list-disc space-y-2 pl-5 text-t2">
          {(block.content ?? []).map((item, i) => (
            <li key={`${key}.${i}`} className="leading-relaxed">
              {item.text}
            </li>
          ))}
        </ul>
      );

    case 'image':
      // alt is required for the image to be worth including at all; without it the picture
      // is decoration and a screen reader is better off skipping it.
      return (
        <figure key={key} className="mt-8">
          {block.url && (
            <img
              src={block.url}
              alt={block.alt ?? ''}
              className="w-full rounded border border-line-soft"
              loading="lazy"
            />
          )}
          {block.caption && (
            <figcaption className="mt-2 text-sm text-t4">{block.caption}</figcaption>
          )}
        </figure>
      );

    case 'divider':
      return <hr key={key} className="mt-10 border-line-soft" />;

    default:
      if (import.meta.env.DEV) {
        console.warn('Bloc d’article non pris en charge :', block.type);
      }
      return null;
  }
}

export default function ArticleBody({ body }: { body: unknown }) {
  if (!body || typeof body !== 'object') {
    return <p className="mt-8 text-t4">Le contenu de cet article est indisponible.</p>;
  }
  return <div className="mt-8">{renderBlock(body as Block, 'b')}</div>;
}
