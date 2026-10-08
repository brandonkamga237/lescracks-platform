import { memo, useState } from 'react';
import { Play } from 'lucide-react';

import ShareButton from '@/components/common/ShareButton';
import VideoPlayer from '@/components/media/VideoPlayer';
import { youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube';
import type { TalkVideo } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

interface TalkSpotlightProps {
  video: TalkVideo;
}

/** The latest episode, announced like the cover of the issue. */
function TalkSpotlight({ video }: TalkSpotlightProps) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = video.coverImage || youtubeThumbnail(video.youtubeUrl);
  const meta = [
    video.guest ? `avec ${video.guest}` : null,
    video.durationMinutes ? `${video.durationMinutes} min` : null,
    video.publishedAt ? dateFormat.format(new Date(video.publishedAt)) : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <article className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <VideoPlayer id={`episode-${video.id}`} url={video.youtubeUrl} title={video.title} poster={thumbnail} platform="YouTube" started={playing} onStart={() => setPlaying(true)} />

      <div className="min-w-0">
        <p className="flex items-baseline gap-3">
          <span className="kicker">Dernier épisode</span>
        </p>
        <h3 className="mt-5 break-words font-display text-4xl font-bold leading-[0.98] tracking-tight text-t1 sm:text-5xl xl:text-[3.25rem] xl:leading-[0.94]">{video.title}</h3>
        <p className="mt-6 line-clamp-3 max-w-xl text-base leading-normal text-t3">{video.description}</p>
        {meta && <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-t4">{meta}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setPlaying(true)} className="btn-primary">
            {playing ? 'Lecture en cours' : 'Regarder l’épisode'}
            <Play className="h-4 w-4" aria-hidden />
          </button>
          {/* The episode lives on YouTube, so that is the link shared: its own preview card is the video. */}
          <ShareButton title={video.title} url={youtubeWatchUrl(video.youtubeUrl)} label="Partager" />
        </div>
      </div>
    </article>
  );
}

export default memo(TalkSpotlight);
