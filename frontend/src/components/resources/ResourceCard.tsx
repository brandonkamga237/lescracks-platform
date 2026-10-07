import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, PlayCircle } from 'lucide-react';

import KindCover from '@/components/illustrations/KindCover';
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
        className="group flex h-full flex-col overflow-hidden rounded bg-card transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 motion-reduce:hover:translate-y-0"
      >
        <span className="relative block aspect-[16/9] overflow-hidden bg-noir-700">
          {resource.coverImage && failedImage !== resource.coverImage ? (
            <img
              src={resource.coverImage}
              alt=""
              loading="lazy"
              onError={() => setFailedImage(resource.coverImage)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <KindCover kind={resource.kind} />
          )}
        </span>
        <span className="flex flex-1 flex-col gap-2 p-4">
          <span className="label flex items-center gap-2">
            <KindIcon className="h-3.5 w-3.5 shrink-0 text-gold-ink" aria-hidden />
            {KIND_LABEL[resource.kind]}
          </span>
          <span className="line-clamp-2 break-words font-display text-base font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-ink">
            {resource.title}
          </span>
          {meta && <span className="mt-auto pt-1 text-xs text-t4">{meta}</span>}
        </span>
      </Link>
    </li>
  );
}

export default memo(ResourceCard);
