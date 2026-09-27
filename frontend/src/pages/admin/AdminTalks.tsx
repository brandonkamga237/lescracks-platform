import { useState } from 'react';
import { Play, Plus } from 'lucide-react';

import { AdminConfirm, AdminModal, AdminPagination, AdminRow, AdminSection, AdminState, StatusBadge } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { TalkRequest } from '@/services/adminApi';
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
}

const EMPTY: FormState = { title: '', youtubeUrl: '', guest: '', description: '', durationMinutes: '', publishedAt: '', status: 'DRAFT' };

function toForm(video: TalkVideo): FormState {
  return {
    title: video.title,
    youtubeUrl: video.youtubeUrl,
    guest: video.guest ?? '',
    description: video.description,
    durationMinutes: video.durationMinutes != null ? String(video.durationMinutes) : '',
    publishedAt: video.publishedAt ? video.publishedAt.slice(0, 16) : '',
    status: video.status,
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
  };
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

  const formFields = (form: FormState, onChange: (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void) => (
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
    </div>
  );

  return (
    <AdminSection title="LesCracks Talk" description="Les épisodes publiés sur YouTube. Colle le lien, la vignette se déduit toute seule.">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) void act('create', () => adminApi.createTalk(toRequest(createForm)), () => { setCreateForm(EMPTY); setNotice('L’épisode a été créé.'); });
        }}
        className="mb-8 rounded-3xl border border-white/[0.06] bg-card p-6"
      >
        {formFields(createForm, (key) => (event) => setCreateForm((form) => ({ ...form, [key]: event.target.value })))}
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={!!busy || !valid} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">
            <Plus className="h-4 w-4" aria-hidden />{busy === 'create' ? 'Ajout…' : 'Ajouter l’épisode'}
          </button>
        </div>
      </form>

      {failure && !editing && !pending && <p role="alert" className="mb-5 rounded-2xl border border-gold-400/40 p-4 text-sm text-t1">{failure}</p>}
      {notice && <p role="status" className="mb-5 text-sm text-gold-400">{notice}</p>}

      <AdminState loading={talks.loading} error={talks.error} empty={!list.length} emptyMessage="Aucun épisode. Ajoute le premier rendez-vous vidéo." onRetry={talks.reload}>
        {list.map((video) => (
          <AdminRow key={video.id}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-noir-800 text-gold-400"><Play className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-display font-medium">{video.title}</h2>
              <p className="mt-1 text-xs text-t3">
                {video.guest ? `${video.guest} · ` : ''}
                {video.publishedAt ? dateFormat.format(new Date(video.publishedAt)) : 'Date non renseignée'}
              </p>
            </div>
            <StatusBadge status={video.status} />
            <div className="flex gap-2" role="group" aria-label={`Actions pour ${video.title}`}>
              <button type="button" disabled={!!busy} onClick={() => { setFailure(null); setEditForm(toForm(video)); setEditing(video); }} className="rounded-full border border-line px-4 py-2 text-xs text-t2 hover:text-gold-400 disabled:opacity-50">Modifier</button>
              <button type="button" disabled={!!busy} onClick={() => { setFailure(null); setPending(video); }} className="rounded-full border border-line px-4 py-2 text-xs text-t2 hover:text-gold-400 disabled:opacity-50">Supprimer</button>
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
          {formFields(editForm, (key) => (event) => setEditForm((form) => ({ ...form, [key]: event.target.value })))}
          {failure && <p role="alert" className="text-sm text-gold-400">{failure}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" disabled={!!busy} onClick={() => { setEditing(null); setFailure(null); }} className="rounded-full border border-line px-5 py-3 text-sm text-t2">Annuler</button>
            <button disabled={!!busy || !editForm.title.trim() || !editForm.youtubeUrl.trim() || !editForm.description.trim()} className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
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
