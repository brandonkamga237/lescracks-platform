interface PrepareOptions {
  /** Widest side kept, in pixels. */
  maxWidth?: number;
  quality?: number;
  /** Covers become JPEG: it is the one format every link-preview fetcher accepts. */
  jpeg?: boolean;
}

/** Below this, an image already at the right width is sent untouched. */
const LIGHT_ENOUGH = 350 * 1024;

/**
 * Resizes and recompresses an image in the browser before upload.
 *
 * Nothing on the server resizes, and a phone photo of several megabytes is what a shared link
 * would then point to: WhatsApp drops preview images that heavy, and readers on mobile data
 * pay for every byte. Any failure returns the original file — a big upload beats a lost one.
 */
export async function prepareImage(file: File, { maxWidth = 1600, quality = 0.82, jpeg = false }: PrepareOptions = {}): Promise<File> {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type) || typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    if (scale === 1 && file.size <= LIGHT_ENOUGH && (!jpeg || file.type === 'image/jpeg')) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    const type = jpeg || file.type !== 'image/png' ? 'image/jpeg' : 'image/png';
    if (type === 'image/jpeg') {
      // JPEG has no transparency: fill with the site's black first so transparent areas stay dark.
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.png');
    return new File([blob], name, { type, lastModified: Date.now() });
  } catch {
    return file;
  }
}
