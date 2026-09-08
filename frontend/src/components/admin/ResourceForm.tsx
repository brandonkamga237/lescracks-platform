import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminModal } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi, type EbookRequest, type VideoRequest } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { ResourceKind, ResourceStatus, ResourceSummary, Tag } from '@/services/types';

interface ResourceFormProps {
  resource?: ResourceSummary;
  onCreated: () => void;
  onCancel: () => void;
}

const VIDEO_PLATFORMS = ['YouTube', 'Vimeo', 'Dailymotion', 'Twitch', 'Loom', 'TikTok', 'Autre'] as const;

export default function ResourceForm({ resource, onCreated, onCancel }: ResourceFormProps) {
  const [kind, setKind] = useState<ResourceKind>(resource?.kind ?? 'EXTERNAL_VIDEO');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(resource?.coverImage ?? null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: resource?.title ?? '',
    description: resource?.description ?? '',
    categoryId: resource?.categoryId ?? '' as number | '',
    tagIds: [] as number[],
    videoUrl: resource?.videoUrl ?? '',
    platform: resource?.platform ?? 'YouTube',
    status: resource?.status ?? 'DRAFT' as ResourceStatus,
  });
  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => (form.categoryId ? api.tags(Number(form.categoryId), signal) : Promise.resolve([] as Tag[])), [form.categoryId]);

  useEffect(() => {
    if (resource && tags.data) {
      const names = new Set(resource.tags ?? []);
      const matched = tags.data.filter((tag) => names.has(tag.name)).map((tag) => tag.id);
      setForm((value) => ({ ...value, tagIds: matched }));
    }
  }, [resource, tags.data]);

  const field = 'input mt-2';
  // The shared input is a fixed-height control; a textarea has to grow with its rows.
  const area = 'input mt-2 h-auto py-3';

  function handleCoverFile(file: File | null) {
    setCoverImageFile(file);
    if (coverPreview && coverPreview !== resource?.coverImage) URL.revokeObjectURL(coverPreview);
    if (file) setCoverPreview(URL.createObjectURL(file));
    else setCoverPreview(resource?.coverImage ?? null);
  }

  function toggleTag(id: number) {
    setForm((value) => ({
      ...value,
      tagIds: value.tagIds.includes(id) ? value.tagIds.filter((tagId) => tagId !== id) : [...value.tagIds, id],
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFailure(null);
    setFieldErrors([]);
    if (!form.title.trim() || !form.description.trim() || !form.categoryId || (!resource && !coverImageFile)) {
      setFailure('Renseigne le titre, la description, la catégorie et une image de couverture.');
      return;
    }
    if (kind === 'EXTERNAL_VIDEO' && (!form.videoUrl.trim() || !form.platform.trim())) {
      setFailure('Renseigne le lien de la vidéo et sa plateforme.');
      return;
    }
    if (kind === 'EBOOK' && !resource && !ebookFile) {
      setFailure('Choisis un fichier ebook.');
      return;
    }
    setBusy(true);
    const base: EbookRequest = {
      title: form.title.trim(),
      description: form.description.trim(),
      coverImage: resource?.coverImage ?? '',
      categoryId: Number(form.categoryId),
      tagIds: form.tagIds,
      status: form.status,
    };
    try {
      if (kind === 'EXTERNAL_VIDEO') {
        const video: VideoRequest = { ...base, videoUrl: form.videoUrl.trim(), platform: form.platform.trim() };
        if (resource) await adminApi.updateVideo(resource.id, video, coverImageFile ?? undefined);
        else await adminApi.createVideo(video, coverImageFile!);
      } else if (resource) {
        await adminApi.updateEbook(resource.id, base, ebookFile ?? undefined, coverImageFile ?? undefined);
      } else if (ebookFile) {
        await adminApi.createEbook(base, ebookFile, coverImageFile!);
      }
      onCreated();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’enregistrement a échoué. Réessaie.');
      if (error instanceof ApiError) setFieldErrors(Object.values(error.fields ?? {}));
    } finally { setBusy(false); }
  }

  return <AdminModal open onClose={onCancel} title={resource ? 'Modifier la ressource' : 'Nouvelle ressource'} description="Prépare le contenu, ajoute sa couverture, puis choisis sa visibilité." busy={busy} wide>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="mb-4 font-display text-lg font-medium">01 — Le contenu</legend>
        <label className="block text-sm text-t2">Type de ressource<select disabled={!!resource} value={kind} onChange={(event) => setKind(event.target.value as ResourceKind)} className={field}><option value="EXTERNAL_VIDEO">Vidéo externe</option><option value="EBOOK">Ebook</option></select></label>
        {resource && <p className="text-xs text-t4">Le type d’une ressource existante ne peut pas être modifié.</p>}
        <label className="block text-sm text-t2">Titre<input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={field} /></label>
        <label className="block text-sm text-t2">Description<textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={area} /></label>

        <label className="block text-sm text-t2">Image de couverture
          <div className="mt-2 rounded-2xl border border-dashed border-line p-5">
            {coverPreview ? <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl border border-line bg-noir-800"><img src={coverPreview} alt="Aperçu de la couverture" className="h-full w-full object-cover" /></div> : null}
            <input required={!resource} type="file" accept="image/*" onChange={(event) => handleCoverFile(event.target.files?.[0] ?? null)} className="block w-full text-sm text-t3 file:mr-4 file:rounded-full file:border-0 file:bg-noir-700 file:px-4 file:py-2 file:text-t1" />
            {resource && !coverImageFile && <p className="mt-2 text-xs text-t3">Laisse vide pour conserver l’image actuelle.</p>}
          </div>
        </label>
      </fieldset>

      <fieldset disabled={busy} className="space-y-5 border-t border-line-soft pt-5">
        <legend className="pr-3 font-display text-lg font-medium">02 — {kind === 'EBOOK' ? 'Le fichier' : 'La vidéo'}</legend>
        {kind === 'EXTERNAL_VIDEO' ? <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm text-t2">Lien de la vidéo<input required type="url" maxLength={1000} placeholder="https://…" value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} className={field} /></label>
          <label className="block text-sm text-t2">Plateforme<select required value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })} className={field}><option value="">Choisir une plateforme</option>{VIDEO_PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></label>
        </div> : <div className="rounded-2xl border border-dashed border-line p-5">
          <label className="block text-sm text-t2">{resource ? 'Remplacer le fichier (facultatif)' : 'Fichier ebook'}<input required={!resource} type="file" onChange={(event) => setEbookFile(event.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-t3 file:mr-4 file:rounded-full file:border-0 file:bg-noir-700 file:px-4 file:py-2 file:text-t1" /></label>
          {resource && <p className="mt-3 text-xs leading-relaxed text-t3">Sans nouveau fichier, le document actuel est conservé{resource.fileFormat ? ` (${resource.fileFormat})` : ''}{resource.fileSize ? ` · ${(resource.fileSize / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Mo` : ''}.</p>}
        </div>}
      </fieldset>

      <fieldset disabled={busy} className="space-y-5 border-t border-line-soft pt-5">
        <legend className="pr-3 font-display text-lg font-medium">03 — Organisation et visibilité</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm text-t2">Catégorie<select required disabled={categories.loading || !!categories.error} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value ? Number(event.target.value) : '', tagIds: [] })} className={field}><option value="">{categories.loading ? 'Chargement…' : 'Choisir une catégorie'}</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="block text-sm text-t2">Statut<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ResourceStatus })} className={field}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée</option><option value="ARCHIVED">Archivée</option></select></label>
        </div>

        {form.categoryId && !tags.loading && !tags.error && (
          <div>
            <p className="text-sm text-t2">Sujets de la catégorie {categories.data?.find((c) => c.id === Number(form.categoryId))?.name}</p>
            {tags.data?.length === 0 ? <p className="mt-2 text-xs text-t3">Aucun sujet pour cette catégorie. <Link to="/admin/tags" className="text-gold-400 underline">Créer un sujet</Link>.</p> : (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.data?.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} aria-pressed={form.tagIds.includes(tag.id)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${form.tagIds.includes(tag.id) ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-line text-t3 hover:text-t1'}`}>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {tags.error && <p role="alert" className="text-sm text-gold-400">{tags.error.message} <button type="button" onClick={tags.reload} className="underline">Réessayer</button></p>}
        {categories.error && <p role="alert" className="text-sm text-gold-400">{categories.error.message} <button type="button" onClick={categories.reload} className="underline">Réessayer</button></p>}
        {!categories.loading && !categories.error && !categories.data?.length && <p className="text-sm text-t3">Crée d’abord une catégorie dans <Link to="/admin/categories" className="text-gold-400 underline">Organisation</Link>.</p>}
        <p className="text-xs leading-relaxed text-t3">{form.status === 'PUBLISHED' ? 'En enregistrant, cette ressource sera visible sur le site public.' : 'Cette ressource ne sera pas visible sur le site public.'}</p>
      </fieldset>

      {failure && <div role="alert" className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-sm text-t1"><p>{failure}</p>{fieldErrors.length > 0 && <ul className="mt-2 list-inside list-disc">{fieldErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}</div>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-line-soft pt-5"><button type="button" disabled={busy} onClick={onCancel} className="rounded-full border border-line px-5 py-3 text-sm text-t2 disabled:opacity-50">Annuler</button><button disabled={busy || categories.loading || !!categories.error || !categories.data?.length} className="rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? 'Enregistrement…' : form.status === 'PUBLISHED' ? 'Enregistrer et publier' : 'Enregistrer'}</button></div>
    </form>
  </AdminModal>;
}
