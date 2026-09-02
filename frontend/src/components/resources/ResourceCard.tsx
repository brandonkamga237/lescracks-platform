import { Link } from 'react-router-dom';
import { BookOpen, FileText, PlayCircle } from 'lucide-react';

import { KIND_LABEL, effortLabel } from '@/lib/effort';
import type { ResourceSummary } from '@/services/types';

interface ResourceCardProps {
  resource: ResourceSummary;
}

const KIND_ICON = {
  VIDEO: PlayCircle,
  EBOOK: BookOpen,
  ARTICLE: FileText,
} as const;

/**
 * A card leads with what it costs, not with a picture.
 *
 * The cover is a thin band rather than a hero: an illustration nobody chose carefully says
 * less about whether to click than "12 min" does, and stacking large images is what made the
 * old catalogue read as a generic content grid.
 */
export default function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = KIND_ICON[resource.kind];
  const effort = effortLabel(resource);

  return (
    <Link
      to={`/ressources/${resource.slug}`}
      className="group flex flex-col gap-4 border-b border-line-soft py-6 transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:flex-row sm:items-baseline sm:gap-8"
    >
      {/* Fixed column, so every cost lines up and the eye scans one list rather than many. */}
      <div className="flex shrink-0 items-center gap-2 sm:w-28">
        <Icon className="h-4 w-4 text-gold-400" aria-hidden />
        <span className="font-mono text-sm tabular-nums text-t2">
          {effort ?? '—'}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-display font-medium text-t1 transition-colors group-hover:text-gold-300">
          {resource.title}
        </h3>
        {resource.summary && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-t3">{resource.summary}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-t4">
          <span className="text-t3">{KIND_LABEL[resource.kind]}</span>
          <span aria-hidden>·</span>
          <span>{resource.categoryName}</span>
          {resource.viewCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>
                consulté {resource.viewCount} fois
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
