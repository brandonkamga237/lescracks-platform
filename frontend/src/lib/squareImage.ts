/**
 * Crops a photo to a centred square and scales it down before upload: a phone photo of
 * several megabytes becomes a ~50 KB image, so the upload is quick even on a slow connection.
 * Falls back to the original file when the browser cannot decode it.
 */
export async function squareImage(file: File, size = 512): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const target = Math.min(size, side);
  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, target, target);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) return file;
  // Safari may ignore the WebP request and return a PNG: the name follows the real type.
  const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
  return new File([blob], `photo.${extension}`, { type: blob.type });
}
