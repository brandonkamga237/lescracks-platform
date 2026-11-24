import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** An article as a card: its cover, its theme, the title and the promise, then when and how long. */
export default function ArticleCard({ article }: { article: ArticleSummary }) {
  const [broken, setBroken] = useState(false);
  const published = article.publishedAt ?? article.createdAt;
  const views = article.viewCount ?? 0;
  return (
    <Link to={articlePath(article)} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-gold-400/40">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gold-400/20 to-white/[0.02]">
        {article.coverImage && !broken
          ? <img src={article.coverImage} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          : <span aria-hidden="true" className="absolute bottom-3 left-4 text-2xl font-semibold tracking-tight text-white/15">LesCracks</span>}
        {article.categoryName && <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-gold-400 backdrop-blur">{article.categoryName}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-gold-400">{article.title}</h3>
        {article.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{article.description}</p>}
        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-white/45">
          <time dateTime={published}>{dateFormat.format(new Date(published))}</time>
          <span aria-hidden="true">·</span>
          {article.readingMinutes ?? 1} min de lecture
          {views > 0 && <><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{views.toLocaleString('fr-FR')}<span className="sr-only"> lectures</span></span></>}
        </p>
      </div>
    </Link>
  );
}
