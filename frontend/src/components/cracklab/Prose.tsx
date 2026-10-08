import { useMemo } from 'react';

import { ArticleBlocks } from '@/components/resources/ArticleRenderer';
import { markdownToBlocks } from '@/lib/articleMarkdown';

interface ProseProps {
  /** Markdown, as typed by an admin (statement, solution) or a member (answer). */
  text: string;
}

/** Statements, answers and solutions read like articles: same Markdown, same typography, code blocks included. */
export default function Prose({ text }: ProseProps) {
  const blocks = useMemo(() => markdownToBlocks(text), [text]);
  return <ArticleBlocks blocks={blocks} />;
}
