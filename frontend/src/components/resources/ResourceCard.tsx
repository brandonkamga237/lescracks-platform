import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, PlayCircle } from 'lucide-react';

import { resourcePath } from '@/lib/slugs';
import { KIND_LABEL, resourceDetail } from '@/lib/resources';
import type { ResourceSummary } from '@/services/types';

const KIND_ICON = { EBOOK: BookOpen, EXTERNAL_VIDEO: PlayCircle, ARTICLE: FileText } as const;

interface ResourceCardProps {
  resource: ResourceSummary;
  /** Where "back" should return to. */
  cataloguePath: string;
}

/**
 * A compact catalogue card: cover, kind, title, one meta line.
 * Kept small on purpose — the grid reads at a glance, text stays secondary.
 */
function ResourceCard({ resource, cataloguePath }: ResourceCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const KindIcon = KIND_ICON[resource.kind];
  const meta = [resource.categoryName, resourceDetail(resource)].filter(Boolean).join('  ·  ');

  return (
    <li className="h-full">
      <Link
        to={resourcePath(resource)}
        state={{ cataloguePath }}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-line-soft/60 bg-noir-900/40 transition-colors hover:border-gold-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <span className="relative block aspect-[16/9] overflow-hidden bg-noir-900">
          {resource.coverImage && failedImage !== resource.coverImage ? (
            <img
              src={resource.coverImage}
              alt=""
              loading="lazy"
              onError={() => setFailedImage(resource.coverImage)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-t4" aria-hidden>
              <KindIcon className="h-7 w-7" />
            </span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-2 p-4">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-t4">
            <KindIcon className="h-3.5 w-3.5 shrink-0 text-gold-400/70" aria-hidden />
            {KIND_LABEL[resource.kind]}
          </span>
          <span className="line-clamp-2 break-words font-display text-base font-medium leading-snug text-t1 transition-colors group-hover:text-gold-300">
            {resource.title}
          </span>
          {meta && <span className="mt-auto pt-1 text-xs text-t4">{meta}</span>}
        </span>
      </Link>
    </li>
  );
}

export default memo(ResourceCard);
