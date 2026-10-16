import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, UserRound } from 'lucide-react';

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

/** The photo is the button: one tap opens the picker, the new face shows at once. */
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
    <div className="flex shrink-0 flex-col items-center gap-2">
      <button type="button" onClick={() => input.current?.click()} disabled={Boolean(busy)}
        aria-label={shown ? 'Changer ma photo' : 'Ajouter une photo'}
        className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gold-400/30 bg-gold-400/10 font-display text-3xl text-gold-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">
        {shown
          ? <img src={shown} alt="" className="h-full w-full object-cover" />
          : name ? name.charAt(0).toUpperCase() : <UserRound aria-hidden="true" className="h-8 w-8" />}
        <span aria-hidden="true" className={`absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-opacity ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <Camera className="h-5 w-5" />}
        </span>
      </button>
      <input ref={input} type="file" accept={ACCEPTED} className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void choose(file); event.target.value = ''; }} />
      {shown && !busy
        ? <button type="button" onClick={() => void remove()} className="text-xs text-t4 underline-offset-4 hover:text-t1 hover:underline">Retirer</button>
        : !shown && !busy && <span className="text-xs text-t4">Ajouter une photo</span>}
      {failure && <p role="alert" className="max-w-[12rem] text-center text-xs text-error-ink">{failure}</p>}
    </div>
  );
}
