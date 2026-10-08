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
        className="group flex h-full overflow-hidden rounded bg-card transition-transform sm:flex-col duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 motion-reduce:hover:translate-y-0"
      >
        {/* Phones get a scannable row (thumbnail beside the title); wider screens the poster card. */}
        <span className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden bg-noir-700 sm:aspect-[16/9] sm:w-auto">
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
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <span className="label flex items-center gap-2">
            <KindIcon className="h-3.5 w-3.5 shrink-0 text-gold-ink" aria-hidden />
            {KIND_LABEL[resource.kind]}
          </span>
          <span className="line-clamp-3 break-words font-display text-[0.9375rem] font-semibold sm:line-clamp-2 sm:text-base leading-snug text-t1 transition-colors group-hover:text-gold-ink">
            {resource.title}
          </span>
          {meta && <span className="mt-auto truncate pt-1 text-xs text-t4">{meta}</span>}
        </span>
      </Link>
    </li>
  );
}

export default memo(ResourceCard);
