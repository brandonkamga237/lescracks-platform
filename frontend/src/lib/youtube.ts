/**
 * YouTube URL helpers. A talk stores the raw URL; everything else — thumbnail,
 * canonical watch link — is derived here.
 */

const PATTERNS = [
  /youtube\.com\/watch\?[^#]*v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/(?:shorts|embed|live)\/([\w-]{11})/,
];

export function youtubeVideoId(url: string): string | null {
  for (const pattern of PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** hqdefault (480×360) exists for every video; maxresdefault often doesn't. */
export function youtubeThumbnail(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function youtubeWatchUrl(url: string): string {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}
