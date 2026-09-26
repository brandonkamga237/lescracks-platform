import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { resourcePath } from '@/lib/slugs';
import type { ResourceSummary } from '@/services/types';

export const KIND_LABEL = { EXTERNAL_VIDEO: 'Vidéo', EBOOK: 'Ebook', ARTICLE: 'Article' } as const;

export function resourceDetail(resource: ResourceSummary): string {
  if (resource.kind === 'EBOOK') return resource.fileFormat ?? 'Document';
  if (resource.kind === 'ARTICLE') return `${resource.readingMinutes ?? 1} min`;
  return resource.platform ?? 'Vidéo externe';
}

interface ResourceIndexItemProps {
  resource: ResourceSummary;
  /** Folio number in the index, e.g. "03". */
  index: string;
  /** Where "back" should return to. */
  cataloguePath: string;
}

/**
 * A catalogue row: folio number, serif title, mono metadata.
 * Rows are ruled by hairlines, not boxed — the list is the composition.
 */
function ResourceIndexItem({ resource, index, cataloguePath }: ResourceIndexItemProps) {
  const meta = [KIND_LABEL[resource.kind], resource.categoryName, resourceDetail(resource)]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <li>
      <Link
        to={resourcePath(resource)}
        state={{ cataloguePath }}
        className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-t border-line-soft/50 px-1 py-5 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:gap-x-6"
      >
        <span className="kicker-muted pt-1" aria-hidden>{index}</span>
        <span className="min-w-0">
          <span className="block break-words font-display text-xl font-medium leading-snug text-t1 transition-colors group-hover:text-gold-300 sm:text-2xl">
            {resource.title}
          </span>
          <span className="mt-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-t4">
            {meta}
          </span>
        </span>
        <ArrowUpRight className="h-5 w-5 self-start pt-1 text-t4 opacity-0 transition-opacity group-hover:text-gold-300 group-hover:opacity-100" aria-hidden />
      </Link>
    </li>
  );
}

export default memo(ResourceIndexItem);
