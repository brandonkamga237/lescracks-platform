import { youtubeVideoId } from '@/lib/youtube';

export interface VideoSource {
  provider: 'YouTube' | 'Vimeo' | 'Dailymotion' | 'Loom' | 'Twitch' | 'TikTok' | 'Google Drive' | 'Fichier';
  /** iframe address, or the file itself when `file` is true. */
  src: string;
  /** A direct video file, played by the browser's own <video>. */
  file?: boolean;
  /** TikTok is vertical; everything else is 16:9. */
  vertical?: boolean;
  thumbnail?: string;
}

function parse(url: string): URL | null {
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
}

/**
 * The embeddable form of a video link, or null when the platform cannot be played inside the
 * site (the page then keeps a link out). `autoplay` is for players opened by a click.
 */
export function videoSource(url: string, autoplay = false): VideoSource | null {
  const parsed = parse(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\.|^m\./, '');
  const play = autoplay ? '1' : '0';

  const youtube = youtubeVideoId(url);
  if (youtube) {
    // The no-cookie domain: nothing is stored on the reader's device until they press play.
    return { provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=${play}&rel=0&modestbranding=1&playsinline=1`, thumbnail: `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg` };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${id}?autoplay=${play}&dnt=1` };
  }
  if (host === 'dailymotion.com' || host === 'dai.ly') {
    const id = host === 'dai.ly' ? parsed.pathname.slice(1) : parsed.pathname.match(/\/video\/([a-z0-9]+)/i)?.[1];
    if (id) return { provider: 'Dailymotion', src: `https://www.dailymotion.com/embed/video/${id}?autoplay=${play}` };
  }
  if (host === 'loom.com') {
    const id = parsed.pathname.match(/\/(?:share|embed)\/([a-f0-9]{16,})/i)?.[1];
    if (id) return { provider: 'Loom', src: `https://www.loom.com/embed/${id}?autoplay=${autoplay}` };
  }
  if (host === 'twitch.tv') {
    // Twitch refuses to play unless told which site embeds it.
    const parent = window.location.hostname;
    const videoId = parsed.pathname.match(/\/videos\/(\d+)/)?.[1];
    if (videoId) return { provider: 'Twitch', src: `https://player.twitch.tv/?video=${videoId}&parent=${parent}&autoplay=${autoplay}` };
    const channel = parsed.pathname.split('/').filter(Boolean)[0];
    if (channel) return { provider: 'Twitch', src: `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=${autoplay}` };
  }
  if (host === 'tiktok.com') {
    const id = parsed.pathname.match(/\/video\/(\d+)/)?.[1];
    if (id) return { provider: 'TikTok', src: `https://www.tiktok.com/embed/v2/${id}`, vertical: true };
  }
  if (host === 'drive.google.com') {
    const id = parsed.pathname.match(/\/file\/d\/([\w-]+)/)?.[1];
    if (id) return { provider: 'Google Drive', src: `https://drive.google.com/file/d/${id}/preview` };
  }
  if (/\.(mp4|webm|ogv|mov)$/i.test(parsed.pathname)) {
    return { provider: 'Fichier', src: parsed.href, file: true };
  }
  return null;
}
