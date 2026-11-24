import { ListRow } from '@/components/ui/list-row';
import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** An article as one line of a list: its cover, in colour on hover, then the title. */
export default function ArticleRow({ article, dense = false }: { article: ArticleSummary; dense?: boolean }) {
  const published = article.publishedAt ?? article.createdAt;
  const minutes = `${article.readingMinutes ?? 1} min`;
  return (
    <ListRow
      to={articlePath(article)}
      dense={dense}
      columns={dense ? 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[5rem_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto] py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)_12rem_auto]'}
      leading={(
        <span className="ml-2 hidden aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-gold-400/20 to-white/[0.03] sm:block">
          {article.coverImage && <img src={article.coverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-110 group-hover:grayscale-0" />}
        </span>
      )}
      title={<span className="pl-2 sm:pl-0">{article.title}</span>}
      subtitle={<span className="pl-2 sm:pl-0">{article.categoryName} · {dense && <><time dateTime={published}>{dateFormat.format(new Date(published))}</time> · </>}{minutes}</span>}
      meta={<>{article.categoryName}<br /><time dateTime={published}>{dateFormat.format(new Date(published))}</time> · {minutes}</>}
    />
  );
}
