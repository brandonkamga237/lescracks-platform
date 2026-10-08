/** Hands a downloaded Blob to the browser as a file to save. */
export function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked later: some browsers start reading the URL only after the click handler returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
