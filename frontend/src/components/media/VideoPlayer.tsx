import { useMemo, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';

import { videoSource } from '@/lib/videoEmbed';

interface VideoPlayerProps {
  url: string;
  title: string;
  /** The site's own cover; the platform's thumbnail is used when there is none. */
  poster?: string | null;
  /** Load the player straight away (inside a dialog opened by a click). */
  autoStart?: boolean;
  /** Platform name to show on the link out when the video cannot be embedded. */
  platform?: string;
  /** Controlled start, for a page that offers its own "watch" button next to the player. */
  started?: boolean;
  onStart?: () => void;
  id?: string;
  className?: string;
}

/**
 * Plays a video inside the page. Until the reader presses play, only a picture is shown: the
 * platform's player (and its trackers) loads on that click, which keeps the page light.
 */
export default function VideoPlayer({ url, title, poster, autoStart = false, platform, started, onStart, id, className = '' }: VideoPlayerProps) {
  const [ownActive, setOwnActive] = useState(autoStart);
  const active = started ?? ownActive;
  const setActive = () => (onStart ? onStart() : setOwnActive(true));
  const [failedPoster, setFailedPoster] = useState(false);
  const source = useMemo(() => videoSource(url, true), [url]);
  const image = !failedPoster ? poster || source?.thumbnail : undefined;
  const frame = `relative overflow-hidden rounded-lg bg-black ${source?.vertical ? 'mx-auto aspect-[9/16] max-h-[80vh]' : 'aspect-video'}`;

  return (
    <figure id={id} className={`scroll-mt-24 ${className}`}>
      <div className={frame}>
        {active && source ? (
          source.file
            ? <video src={source.src} controls autoPlay playsInline className="h-full w-full" title={title} />
            : <iframe src={source.src} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <>
            {image ? <img src={image} alt="" onError={() => setFailedPoster(true)} className="h-full w-full object-cover" /> : <span aria-hidden className="block h-full w-full bg-noir-800" />}
            {source ? (
              <button type="button" onClick={setActive} aria-label={`Lire la vidéo « ${title} »`}
                className="group absolute inset-0 flex items-center justify-center bg-black/30 transition-colors duration-150 hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-black transition-colors duration-150 group-hover:bg-gold-300">
                  <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden />
                </span>
              </button>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 p-6 text-center">
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Ouvrir sur {platform || 'la plateforme'}<ExternalLink className="h-4 w-4" aria-hidden /><span className="sr-only"> (nouvel onglet)</span>
                </a>
              </span>
            )}
          </>
        )}
      </div>
      {source && (
        <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-t4">
          <span>Lecture via {source.provider === 'Fichier' ? 'le lecteur du navigateur' : source.provider}</span>
          {!source.file && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:text-t2 hover:underline">Ouvrir sur {source.provider}<ExternalLink className="h-3 w-3" aria-hidden /></a>}
        </figcaption>
      )}
    </figure>
  );
}
