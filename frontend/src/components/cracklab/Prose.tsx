import { useMemo } from 'react';

import { ArticleBlocks } from '@/components/resources/ArticleRenderer';
import { markdownToBlocks } from '@/lib/articleMarkdown';

interface ProseProps {
  /** Markdown, as typed by an admin (statement, solution) or a member (answer). */
  text: string;
  /** Inside a card (an answer, the constraints): headings shrink so they do not outshout the frame. */
  compact?: boolean;
}

/** Statements, answers and solutions read like articles: same Markdown, same typography, code blocks included. */
export default function Prose({ text, compact = false }: ProseProps) {
  const blocks = useMemo(() => markdownToBlocks(text), [text]);
  if (!compact) return <ArticleBlocks blocks={blocks} />;
  return (
    <div className="text-base [&_h2]:mt-8 [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:text-lg [&_li]:text-base [&_p]:text-base [&_p]:leading-relaxed">
      <ArticleBlocks blocks={blocks} />
    </div>
  );
}
