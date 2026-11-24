import { Target } from 'lucide-react';

import ArticleRow from '@/components/blog/ArticleRow';
import DashSection from '@/components/member/DashSection';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { BlogTheme } from '@/services/types';

const SHOWN = 3;

interface InterestShelfProps {
  theme: BlogTheme;
  /** Articles the member already opened, left out: the shelf is for what comes next. */
  read: Set<number>;
}

/** A few articles of one theme the member said they care about, those they have not opened first. */
export default function InterestShelf({ theme, read }: InterestShelfProps) {
  const found = useApi((signal) => api.searchArticles({ categoryId: theme.id, size: SHOWN + 6 }, signal), [theme.id], `articles:theme:${theme.id}`);
  const articles = found.data?.content ?? [];
  const fresh = [...articles.filter((article) => !read.has(article.id)), ...articles.filter((article) => read.has(article.id))].slice(0, SHOWN);
  if (fresh.length === 0) return null;

  return (
    <DashSection id={`interest-${theme.id}`} title={`Pour toi · ${theme.name}`} Icon={Target} more={{ to: `/blog?theme=${theme.slug}`, label: `${theme.articleCount} article${theme.articleCount > 1 ? 's' : ''}` }}>
      <ul className="border-t border-white/10">
        {fresh.map((article) => <li key={article.id}><ArticleRow article={article} dense /></li>)}
      </ul>
    </DashSection>
  );
}
