import { memo, useState } from 'react';
import { Play } from 'lucide-react';

import VideoPlayer from '@/components/media/VideoPlayer';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import { youtubeThumbnail } from '@/lib/youtube';
import type { TalkVideo } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

interface EpisodeRowProps {
  video: TalkVideo;
}

/** One episode in the playlist: thumbnail, title and guest. It plays in a dialog, on the site. */
function EpisodeRow({ video }: EpisodeRowProps) {
  const [failedThumb, setFailedThumb] = useState(false);
  const [open, setOpen] = useState(false);
  const thumbnail = video.coverImage || youtubeThumbnail(video.youtubeUrl);
  const meta = [
    video.guest ? `avec ${video.guest}` : null,
    video.durationMinutes ? `${video.durationMinutes} min` : null,
    video.publishedAt ? dateFormat.format(new Date(video.publishedAt)) : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative isolate grid w-full grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-white/10 px-2 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:gap-x-6"
      >
        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white/[0.03] transition-transform duration-500 ease-out group-hover:scale-x-100" />
        <span className="relative aspect-[16/9] overflow-hidden rounded-xl bg-white/[0.04]">
          {thumbnail && !failedThumb ? (
            <img src={thumbnail} alt="" loading="lazy" onError={() => setFailedThumb(true)} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-white/35" aria-hidden>
              <Play className="h-4 w-4" />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
            <Play className="h-5 w-5 text-white" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block break-words text-base font-medium tracking-tight transition-[color,transform] duration-500 ease-out group-hover:translate-x-2 group-hover:text-gold-400 sm:text-lg">
            {video.title}
          </span>
          {meta && <span className="mt-1.5 block text-sm text-white/50">{meta}</span>}
        </span>
        <span aria-hidden className="mr-2 grid h-9 w-9 place-items-center rounded-full border border-white/20 transition-colors group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-black"><Play className="h-4 w-4" /></span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%_-_1rem)] max-w-4xl rounded-3xl border-white/10 bg-noir-900 p-3 sm:p-5">
          <DialogTitle className="pr-10 text-lg font-semibold leading-tight tracking-tight sm:text-xl">{video.title}</DialogTitle>
          {meta && <DialogDescription className="text-xs text-white/50">{meta}</DialogDescription>}
          {open && <VideoPlayer url={video.youtubeUrl} title={video.title} poster={thumbnail} platform="YouTube" autoStart />}
        </DialogContent>
      </Dialog>
    </li>
  );
}

export default memo(EpisodeRow);
