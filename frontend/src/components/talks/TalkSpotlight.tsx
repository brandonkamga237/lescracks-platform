import { memo, useState } from 'react';
import { Play } from 'lucide-react';

import { youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube';
import type { TalkVideo } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

interface TalkSpotlightProps {
  video: TalkVideo;
}

/** The latest episode, announced like the cover of the issue. */
function TalkSpotlight({ video }: TalkSpotlightProps) {
  const [failedThumb, setFailedThumb] = useState(false);
  const thumbnail = youtubeThumbnail(video.youtubeUrl);
  const meta = [
    video.guest ? `avec ${video.guest}` : null,
    video.durationMinutes ? `${video.durationMinutes} min` : null,
    video.publishedAt ? dateFormat.format(new Date(video.publishedAt)) : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <article className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <a
        href={youtubeWatchUrl(video.youtubeUrl)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Regarder « ${video.title} » sur YouTube`}
        className="group relative block aspect-[16/10] overflow-hidden rounded border border-line-soft/60 bg-noir-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        {thumbnail && !failedThumb ? (
          <img
            src={thumbnail}
            alt=""
            onError={() => setFailedThumb(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <span className="flex h-full items-end p-6" aria-hidden>
            <span className="font-display text-6xl font-medium leading-none text-white/[0.07] sm:text-8xl">Talk</span>
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
          </span>
        </span>
      </a>

      <div className="min-w-0">
        <p className="flex items-baseline gap-3">
          <span className="kicker">Dernier épisode</span>
          <span className="kicker-muted">YouTube</span>
        </p>
        <h3 className="mt-5 break-words font-display text-3xl font-medium leading-[1.12] tracking-tight text-t1 sm:text-4xl xl:text-[2.75rem]">
          <a
            href={youtubeWatchUrl(video.youtubeUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {video.title}
          </a>
        </h3>
        <p className="mt-5 line-clamp-3 max-w-xl text-base leading-relaxed text-t3">{video.description}</p>
        {meta && <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-t4">{meta}</p>}
        <a
          href={youtubeWatchUrl(video.youtubeUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-gold-ink transition-colors hover:text-gold-300"
        >
          Regarder l’épisode
          <Play className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export default memo(TalkSpotlight);
