import { memo, useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';

import { youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube';
import type { TalkVideo } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

interface EpisodeRowProps {
  video: TalkVideo;
}

/**
 * One episode in the playlist: thumbnail, title and guest.
 * It opens the YouTube video in a new tab — talks live there, not on the site.
 */
function EpisodeRow({ video }: EpisodeRowProps) {
  const [failedThumb, setFailedThumb] = useState(false);
  const thumbnail = youtubeThumbnail(video.youtubeUrl);
  const meta = [
    video.guest ? `avec ${video.guest}` : null,
    video.durationMinutes ? `${video.durationMinutes} min` : null,
    video.publishedAt ? dateFormat.format(new Date(video.publishedAt)) : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <li>
      <a
        href={youtubeWatchUrl(video.youtubeUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-x-4 border-t border-line px-2 py-5 transition-colors hover:bg-noir-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:gap-x-6"
      >
        <span className="relative aspect-[16/9] overflow-hidden rounded bg-noir-700">
          {thumbnail && !failedThumb ? (
            <img src={thumbnail} alt="" loading="lazy" onError={() => setFailedThumb(true)} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-t4" aria-hidden>
              <Play className="h-4 w-4" />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
            <Play className="h-5 w-5 text-white" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block break-words font-display text-lg font-bold leading-tight text-t1 transition-colors group-hover:text-gold-ink sm:text-xl">
            {video.title}
          </span>
          {meta && <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-t4">{meta}</span>}
        </span>
        <ArrowUpRight className="h-5 w-5 text-t4 opacity-0 transition-opacity group-hover:text-gold-ink group-hover:opacity-100" aria-hidden />
      </a>
    </li>
  );
}

export default memo(EpisodeRow);
