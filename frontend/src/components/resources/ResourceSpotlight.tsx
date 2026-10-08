import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import KindCover from '@/components/illustrations/KindCover';
import { resourcePath } from '@/lib/slugs';
import { KIND_LABEL, resourceDetail } from '@/lib/resources';
import type { ResourceSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

interface ResourceSpotlightProps {
  resource: ResourceSummary;
  /** Gold label above the title, e.g. "À la une". */
  kicker?: string;
  cataloguePath: string;
}

/**
 * The featured resource: an asymmetric editorial block, not a bigger card.
 * The cover leads, the serif title carries the rest.
 */
function ResourceSpotlight({ resource, kicker = 'À la une', cataloguePath }: ResourceSpotlightProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const meta = [resource.categoryName, resourceDetail(resource)]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <article className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <Link
        to={resourcePath(resource)}
        state={{ cataloguePath }}
        className="block aspect-[16/10] overflow-hidden bg-noir-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        aria-label={resource.title}
      >
        {resource.coverImage && failedImage !== resource.coverImage ? (
          <img
            src={resource.coverImage}
            alt=""
            onError={() => setFailedImage(resource.coverImage)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
        ) : (
          <KindCover kind={resource.kind} size="spotlight" />
        )}
      </Link>

      <div className="min-w-0">
        <p className="flex items-baseline gap-3">
          <span className="kicker">{kicker}</span>
          <span className="label">{KIND_LABEL[resource.kind]}</span>
        </p>
        <h3 className="mt-5 break-words font-display text-4xl font-bold leading-[0.98] tracking-tight text-t1 sm:text-5xl xl:text-[3.25rem] xl:leading-[0.94]">
          <Link
            to={resourcePath(resource)}
            state={{ cataloguePath }}
            className="transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {resource.title}
          </Link>
        </h3>
        <p className="mt-6 line-clamp-3 max-w-xl text-base leading-normal text-t3">
          {resource.description}
        </p>
        <p className="label mt-6">
          {meta}
          {(resource.publishedAt ?? resource.createdAt) && `  ·  Publié le ${dateFormat.format(new Date(resource.publishedAt ?? resource.createdAt))}`}
        </p>
        <Link
          to={resourcePath(resource)}
          state={{ cataloguePath }}
          className="btn-primary mt-8"
        >
          Ouvrir la ressource
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export default memo(ResourceSpotlight);
