import { useState } from 'react';
import { ImagePlus, Loader2, Pencil, Play, Plus, Trash2, X } from 'lucide-react';

import { AdminAction, AdminConfirm, AdminModal, AdminPagination, AdminRow, AdminSection, AdminState, StatusBadge } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { TalkRequest } from '@/services/adminApi';
import { prepareImage } from '@/lib/image';
import { youtubeThumbnail } from '@/lib/youtube';
import { ApiError } from '@/services/http';
import type { TalkStatus, TalkVideo } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const field = 'input mt-2';

interface FormState {
  title: string;
  youtubeUrl: string;
  guest: string;
  description: string;
  durationMinutes: string;
  publishedAt: string;
  status: TalkStatus;
  coverImage: string;
}

const EMPTY: FormState = { title: '', youtubeUrl: '', guest: '', description: '', durationMinutes: '', publishedAt: '', status: 'DRAFT', coverImage: '' };

function toForm(video: TalkVideo): FormState {
  return {
    title: video.title,
    youtubeUrl: video.youtubeUrl,
    guest: video.guest ?? '',
    description: video.description,
    durationMinutes: video.durationMinutes != null ? String(video.durationMinutes) : '',
    publishedAt: video.publishedAt ? video.publishedAt.slice(0, 16) : '',
    status: video.status,
    coverImage: video.coverImage ?? '',
  };
}

function toRequest(form: FormState): TalkRequest {
  return {
    title: form.title.trim(),
    youtubeUrl: form.youtubeUrl.trim(),
    description: form.description.trim(),
    guest: form.guest.trim() || undefined,
    durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
    status: form.status,
    coverImage: form.coverImage || undefined,
  };
}

interface TalkCoverFieldProps {
  value: string;
  youtubeUrl: string;
  disabled: boolean;
  onChange: (url: string) => void;
}

/** The episode's cover: an uploaded image, or the YouTube thumbnail when none is chosen. */
function TalkCoverField({ value, youtubeUrl, disabled, onChange }: TalkCoverFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fallback = youtubeThumbnail(youtubeUrl);
  const shown = value || fallback;

  async function upload(file: File) {
    setUploading(true);
    setError('');
    try {
      const { url } = await adminApi.uploadImage(await prepareImage(file, { jpeg: true }));
      onChange(url);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'L’envoi de l’image a échoué. Réessaie.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-sm text-t2">Couverture</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded border border-line bg-noir-800 sm:w-56">
          {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-t4">Aucune image</span>}
          {!value && fallback && <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-t2">Miniature YouTube</span>}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className={`btn-secondary cursor-pointer ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
              {uploading ? 'Envoi…' : value ? 'Changer l’image' : 'Choisir une image'}
              <input type="file" accept="image/*" className="sr-only" disabled={disabled || uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
            </label>
            {value && <button type="button" disabled={disabled} onClick={() => onChange('')} className="btn-secondary text-t3"><X className="h-4 w-4" aria-hidden />Retirer</button>}
          </div>
          <p className="text-xs leading-relaxed text-t4">Format 16:9, idéalement 1600 × 900. Elle remplace la miniature YouTube sur le site et dans les partages.</p>
          {error && <p role="alert" className="text-xs text-error-ink">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminTalks() {
  const [page, setPage] = useState(0);
  const talks = useApi((signal) => adminApi.talks(page, signal), [page]);
  const list = talks.data?.content ?? [];
  const [createForm, setCreateForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<TalkVideo | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);
  const [pending, setPending] = useState<TalkVideo | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: string, work: () => Promise<unknown>, onSuccess: () => void) {
    if (busy) return;
    setBusy(action);
    setFailure(null);
    setNotice('');
    try { await work(); onSuccess(); talks.reload(); }
    catch (error) { setFailure(error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.'); }
    finally { setBusy(null); }
  }

  const valid = createForm.title.trim() && createForm.description.trim() && createForm.youtubeUrl.trim();

  const formFields = (form: FormState, onChange: (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, onCover: (url: string) => void) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm text-t2 sm:col-span-2">Titre de l’épisode
        <input required maxLength={200} disabled={!!busy} value={form.title} onChange={onChange('title')} placeholder="Ex. Devenir développeur sans diplôme" className={field} />
      </label>
      <label className="block text-sm text-t2 sm:col-span-2">Lien YouTube
        <input required type="url" maxLength={1000} disabled={!!busy} value={form.youtubeUrl} onChange={onChange('youtubeUrl')} placeholder="https://www.youtube.com/watch?v=…" className={field} />
      </label>
      <label className="block text-sm text-t2">Invité·e (optionnel)
        <input maxLength={160} disabled={!!busy} value={form.guest} onChange={onChange('guest')} placeholder="Nom de l’invité·e" className={field} />
      </label>
      <label className="block text-sm text-t2">Durée en minutes (optionnel)
        <input type="number" min={1} max={600} disabled={!!busy} value={form.durationMinutes} onChange={onChange('durationMinutes')} placeholder="Ex. 42" className={field} />
      </label>
      <label className="block text-sm text-t2">Publié le (optionnel)
        <input type="datetime-local" disabled={!!busy} value={form.publishedAt} onChange={onChange('publishedAt')} className={field} />
      </label>
      <label className="block text-sm text-t2">Statut
        <select disabled={!!busy} value={form.status} onChange={onChange('status')} className={field}>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </label>
      <label className="block text-sm text-t2 sm:col-span-2">Description
        <textarea required rows={3} disabled={!!busy} value={form.description} onChange={onChange('description')} placeholder="De quoi parle l’épisode, en deux phrases." className={field} />
      </label>
      <TalkCoverField value={form.coverImage} youtubeUrl={form.youtubeUrl} disabled={!!busy} onChange={(url) => onCover(url)} />
    </div>
  );

  return (
    <AdminSection title="LesCracks Talk" description="Les épisodes publiés sur YouTube. Colle le lien et ajoute une couverture, ou garde la miniature YouTube.">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) void act('create', () => adminApi.createTalk(toRequest(createForm)), () => { setCreateForm(EMPTY); setNotice('L’épisode a été créé.'); });
        }}
        className="mb-8 rounded-lg border border-line-soft bg-card p-6"
      >
        {formFields(createForm, (key) => (event) => setCreateForm((form) => ({ ...form, [key]: event.target.value })), (coverImage) => setCreateForm((form) => ({ ...form, coverImage })))}
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={!!busy || !valid} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden />{busy === 'create' ? 'Ajout…' : 'Ajouter l’épisode'}
          </button>
        </div>
      </form>

      {failure && !editing && !pending && <p role="alert" className="mb-5 rounded-lg border border-gold-400/40 p-4 text-sm text-t1">{failure}</p>}
      {notice && <p role="status" className="mb-5 text-sm text-gold-ink">{notice}</p>}

      <AdminState loading={talks.loading} error={talks.error} empty={!list.length} emptyMessage="Aucun épisode. Ajoute le premier rendez-vous vidéo." onRetry={talks.reload}>
        {list.map((video) => (
          <AdminRow key={video.id}>
            <span className="hidden aspect-video w-24 shrink-0 overflow-hidden rounded bg-noir-800 sm:block">{video.coverImage || youtubeThumbnail(video.youtubeUrl) ? <img src={video.coverImage || youtubeThumbnail(video.youtubeUrl) || ''} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-gold-ink"><Play className="h-5 w-5" aria-hidden /></span>}</span>
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-base font-semibold leading-snug tracking-normal text-t1 sm:text-lg">{video.title}</h2>
              <p className="mt-1 text-xs text-t3">
                {video.guest ? `${video.guest} · ` : ''}
                {video.publishedAt ? dateFormat.format(new Date(video.publishedAt)) : 'Date non renseignée'}
              </p>
            </div>
            <StatusBadge status={video.status} />
            <div className="flex gap-2" role="group" aria-label={`Actions pour ${video.title}`}>
              <AdminAction icon={Pencil} label="Modifier" disabled={!!busy} onClick={() => { setFailure(null); setEditForm(toForm(video)); setEditing(video); }} />
              <AdminAction icon={Trash2} label="Supprimer" danger disabled={!!busy} onClick={() => { setFailure(null); setPending(video); }} />
            </div>
          </AdminRow>
        ))}
        <AdminPagination page={page} totalPages={talks.data?.totalPages ?? 0} totalElements={talks.data?.totalElements ?? 0} busy={!!busy} onChange={setPage} />
      </AdminState>

      <AdminModal open={!!editing} onClose={() => { setEditing(null); setFailure(null); }} title="Modifier l’épisode" description="Le lien YouTube peut changer, l’épisode garde sa place." busy={!!busy} wide>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (editing) void act(`edit-${editing.id}`, () => adminApi.updateTalk(editing.id, toRequest(editForm)), () => { setEditing(null); setNotice('L’épisode a été modifié.'); });
          }}
          className="space-y-5"
        >
          {formFields(editForm, (key) => (event) => setEditForm((form) => ({ ...form, [key]: event.target.value })), (coverImage) => setEditForm((form) => ({ ...form, coverImage })))}
          {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" disabled={!!busy} onClick={() => { setEditing(null); setFailure(null); }} className="btn-secondary">Annuler</button>
            <button disabled={!!busy || !editForm.title.trim() || !editForm.youtubeUrl.trim() || !editForm.description.trim()} className="btn-primary">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </AdminModal>

      <AdminConfirm
        open={!!pending}
        title="Supprimer cet épisode ?"
        description={pending ? `« ${pending.title} » sera retiré de la page Talk définitivement.` : ''}
        busy={!!busy}
        error={failure}
        onCancel={() => { setPending(null); setFailure(null); }}
        onConfirm={() => { if (pending) void act(`delete-${pending.id}`, () => adminApi.deleteTalk(pending.id), () => { setPending(null); setNotice('L’épisode a été supprimé.'); }); }}
      />
    </AdminSection>
  );
}
