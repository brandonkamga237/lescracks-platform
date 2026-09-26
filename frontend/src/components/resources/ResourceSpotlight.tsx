import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { resourcePath } from '@/lib/slugs';
import { KIND_LABEL, resourceDetail } from '@/components/resources/ResourceIndexItem';
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
    <article className="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <Link
        to={resourcePath(resource)}
        state={{ cataloguePath }}
        className="block aspect-[16/10] overflow-hidden rounded border border-line-soft/60 bg-noir-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        aria-label={resource.title}
      >
        {resource.coverImage && failedImage !== resource.coverImage ? (
          <img
            src={resource.coverImage}
            alt=""
            onError={() => setFailedImage(resource.coverImage)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-end p-6" aria-hidden>
            <span className="font-display text-6xl font-medium leading-none text-white/[0.07] sm:text-8xl">
              {KIND_LABEL[resource.kind]}
            </span>
          </div>
        )}
      </Link>

      <div className="min-w-0">
        <p className="flex items-baseline gap-3">
          <span className="kicker">{kicker}</span>
          <span className="kicker-muted">{KIND_LABEL[resource.kind]}</span>
        </p>
        <h3 className="mt-5 break-words font-display text-3xl font-medium leading-[1.12] tracking-tight text-t1 sm:text-4xl xl:text-[2.75rem]">
          <Link
            to={resourcePath(resource)}
            state={{ cataloguePath }}
            className="transition-colors hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {resource.title}
          </Link>
        </h3>
        <p className="mt-5 line-clamp-3 max-w-xl text-base leading-relaxed text-t3">
          {resource.description}
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-t4">
          {meta}
          {resource.createdAt && `  ·  Publié le ${dateFormat.format(new Date(resource.createdAt))}`}
        </p>
        <Link
          to={resourcePath(resource)}
          state={{ cataloguePath }}
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
        >
          Ouvrir la ressource
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export default memo(ResourceSpotlight);
