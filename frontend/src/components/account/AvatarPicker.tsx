import { useEffect, useRef, useState } from 'react';
import { Loader2, Pencil, UserRound } from 'lucide-react';

import { squareImage } from '@/lib/squareImage';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

interface AvatarPickerProps {
  name: string | null;
  avatarUrl?: string;
  /** Called once the server has the new photo (or none), to refresh the session. */
  onChanged: () => Promise<void>;
}

const ACCEPTED = 'image/jpeg,image/png,image/webp';

/** The photo is the button, and its pencil says so: one tap opens the picker, the new face shows at once. */
export default function AvatarPicker({ name, avatarUrl, onChanged }: AvatarPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [failure, setFailure] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function choose(file: File) {
    setFailure('');
    if (!ACCEPTED.split(',').includes(file.type)) {
      setFailure('Choisis une image JPEG, PNG ou WebP.');
      return;
    }
    setBusy('upload');
    const photo = await squareImage(file);
    setPreview(URL.createObjectURL(photo));
    try {
      await api.uploadAvatar(photo);
      await onChanged();
    } catch (cause) {
      setPreview(null);
      setFailure(cause instanceof ApiError ? cause.message : 'La photo n’a pas pu être envoyée. Réessaie dans un instant.');
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setFailure('');
    setBusy('remove');
    try {
      await api.removeAvatar();
      setPreview(null);
      await onChanged();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'La photo n’a pas pu être retirée.');
    } finally {
      setBusy(null);
    }
  }

  const shown = preview ?? avatarUrl;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <button type="button" onClick={() => input.current?.click()} disabled={Boolean(busy)}
        aria-label={shown ? 'Changer ma photo' : 'Ajouter une photo'}
        className="group relative h-16 w-16 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:h-20 sm:w-20">
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-gold-400/30 bg-gold-400/10 font-display text-2xl text-gold-ink sm:text-3xl">
          {shown
            ? <img src={shown} alt="" className="h-full w-full object-cover" />
            : name ? name.charAt(0).toUpperCase() : <UserRound aria-hidden="true" className="h-8 w-8" />}
        </span>
        {busy && (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white">
            <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
          </span>
        )}
        <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-gold-400 text-black transition-transform group-hover:scale-110 motion-reduce:transition-none sm:h-8 sm:w-8">
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </button>
      <input ref={input} type="file" accept={ACCEPTED} className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void choose(file); event.target.value = ''; }} />
      {shown && !busy && <button type="button" onClick={() => void remove()} className="text-xs text-t4 underline-offset-4 hover:text-t1 hover:underline">Retirer</button>}
      {failure && <p role="alert" className="max-w-[12rem] text-center text-xs text-error-ink">{failure}</p>}
    </div>
  );
}
