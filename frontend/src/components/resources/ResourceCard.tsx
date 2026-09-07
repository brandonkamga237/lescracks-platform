import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import type { ResourceSummary } from '@/services/types';

interface ResourceCardProps {
  resource: ResourceSummary;
}

const KIND_LABEL = { EXTERNAL_VIDEO: 'Vidéo', EBOOK: 'Ebook' } as const;

/**
 * A compact catalogue row that leads with the subject and format.
 */
export default function ResourceCard({ resource }: ResourceCardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, signIn } = useSession();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(resource.likeCount ?? 0);
  const [liking, setLiking] = useState(false);

  const cataloguePath = /^\/ressources(?:\/(?:ebooks|videos))?$/.test(location.pathname)
    ? `${location.pathname}${location.search}`
    : '/ressources';

  async function toggleLike(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (!isSignedIn) {
      signIn(`/ressources/${resource.id}`);
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      const status = liked
        ? await api.unlikeResource(resource.id)
        : await api.likeResource(resource.id);
      setLiked(status.liked);
      setLikeCount(status.count);
    } finally {
      setLiking(false);
    }
  }

  function open() {
    navigate(`/ressources/${resource.id}`, { state: { cataloguePath } });
  }

  return (
    <article
      onClick={open}
      className="group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-noir-900 transition-colors hover:border-gold-400/50 hover:bg-noir-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } }}
    >
      <div className="aspect-[16/9] overflow-hidden border-b border-line-soft bg-noir-800">
        {resource.coverImage && failedImage !== resource.coverImage ? (
          <img
            src={resource.coverImage}
            alt=""
            loading="lazy"
            onError={() => setFailedImage(resource.coverImage)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-end bg-noir-800 p-5" aria-hidden>
            <span className="font-display text-5xl font-semibold leading-none text-white/10">{KIND_LABEL[resource.kind]}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-t4">
          {KIND_LABEL[resource.kind]}
          {resource.categoryName ? <span className="text-gold-400"> · {resource.categoryName}</span> : ''}
        </p>
        <h3 className="mt-2 break-words font-display text-lg font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-300">{resource.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-t3">{resource.description}</p>
        {resource.tags?.length > 0 && (
          <p className="mt-3 line-clamp-1 text-xs text-t4">{resource.tags.slice(0, 4).join(' · ')}</p>
        )}
      </div>
      <button
        onClick={toggleLike}
        disabled={liking}
        aria-label={liked ? 'Retirer le coup de cœur' : 'Mettre un coup de cœur'}
        className={`absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 ${liked ? 'border-gold-400 bg-gold-400/15 text-gold-300' : 'border-line/60 bg-black/50 text-t3 hover:text-gold-300'}`}
      >
        <Heart filled={liked} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
    </article>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-gold-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
