import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, ExternalLink, FileText, PlayCircle } from 'lucide-react';

import ResourceShare from '@/components/resources/ResourceShare';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import type { ResourceSummary } from '@/services/types';

interface ResourceCardProps {
  resource: ResourceSummary;
}

const KIND_LABEL = { EXTERNAL_VIDEO: 'Vidéo', EBOOK: 'Ebook' } as const;

function formatSize(bytes?: number): string {
  if (bytes == null || bytes <= 0) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, signIn } = useSession();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(resource.likeCount ?? 0);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    let ignore = false;
    const signal = new AbortController();
    api.resourceLikes(resource.id, signal.signal)
      .then((status) => { if (!ignore) { setLiked(status.liked); setLikeCount(status.count); } })
      .catch(() => { /* count comes from the summary; keep defaults on error */ });
    return () => { ignore = true; signal.abort(); };
  }, [resource.id]);

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

  const detail = resource.kind === 'EBOOK'
    ? `${resource.fileFormat ?? 'Document'}${resource.fileSize ? ` · ${formatSize(resource.fileSize)}` : ''}`
    : (resource.platform ?? 'Vidéo externe');

  return (
    <article
      onClick={open}
      className="group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-noir-900 transition-colors hover:border-gold-400/50 hover:bg-noir-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } }}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line-soft bg-noir-800">
        {resource.coverImage && failedImage !== resource.coverImage ? (
          <img
            src={resource.coverImage}
            alt=""
            loading="lazy"
            onError={() => setFailedImage(resource.coverImage)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-end bg-noir-800 p-5" aria-hidden>
            <span className="font-display text-5xl font-semibold leading-none text-white/10">{KIND_LABEL[resource.kind]}</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full border border-gold-400/30 bg-black/70 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-gold-400 backdrop-blur-sm">
            {KIND_LABEL[resource.kind]}
          </span>
          {resource.categoryName && (
            <span className="rounded-full border border-line/60 bg-black/70 px-2.5 py-1 text-[10px] font-medium text-t2 backdrop-blur-sm">
              {resource.categoryName}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 break-words font-display text-lg font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-300">{resource.title}</h3>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-t3">{resource.description}</p>

        {resource.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-md border border-line-soft bg-noir-950 px-2 py-0.5 text-[10px] font-medium text-t4">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-line-soft pt-3 text-xs text-t4">
            <div className="flex items-center gap-1.5">
              {resource.kind === 'EBOOK' ? <FileText className="h-3.5 w-3.5 text-gold-400" aria-hidden /> : <PlayCircle className="h-3.5 w-3.5 text-gold-400" aria-hidden />}
              <span className="text-t3">{detail}</span>
            </div>
            {resource.kind === 'EBOOK' && resource.downloadUrl ? (
              <span className="inline-flex items-center gap-1 text-gold-400" aria-hidden><Download className="h-3 w-3" /> Télécharger</span>
            ) : resource.kind === 'EXTERNAL_VIDEO' && resource.videoUrl ? (
              <span className="inline-flex items-center gap-1 text-gold-400" aria-hidden><ExternalLink className="h-3 w-3" /> Voir</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <ResourceShare resourceId={resource.id} title={resource.title} compact />
        <button
          onClick={toggleLike}
          disabled={liking}
          aria-label={liked ? 'Retirer le coup de cœur' : 'Mettre un coup de cœur'}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 ${liked ? 'border-gold-400 bg-gold-400/15 text-gold-300' : 'border-line/60 bg-black/60 text-t3 hover:text-gold-300'}`}
        >
          <Heart filled={liked} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
      </div>
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
