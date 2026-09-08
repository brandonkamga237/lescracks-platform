import { useState } from 'react';
import { AdminModal } from '@/components/admin/AdminTable';
import { adminApi, type EventRequest } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { EventFormat, EventStatus, EventSummary, EventType } from '@/services/types';

interface EventFormProps {
  event?: EventSummary;
  onCreated: () => void;
  onCancel: () => void;
}

function localDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function EventForm({ event: initial, onCreated, onCancel }: EventFormProps) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.coverImage ?? null);
  const [form, setForm] = useState<EventRequest>({ title: initial?.title ?? '', description: initial?.description ?? '', type: initial?.type ?? 'WORKSHOP', format: initial?.format ?? 'ONLINE', startDate: localDate(initial?.startDate), endDate: localDate(initial?.endDate), location: initial?.location ?? '', status: initial?.status ?? 'DRAFT' });
  const field = 'input mt-2';
  // The shared input is a fixed-height control; a textarea has to grow with its rows.
  const area = 'input mt-2 h-auto py-3';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function handleCoverFile(file: File | null) {
    setCoverImageFile(file);
    if (coverPreview && coverPreview !== initial?.coverImage) URL.revokeObjectURL(coverPreview);
    if (file) setCoverPreview(URL.createObjectURL(file));
    else setCoverPreview(initial?.coverImage ?? null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFailure(null);
    setFieldErrors([]);
    const start = new Date(form.startDate);
    const end = form.endDate ? new Date(form.endDate) : undefined;
    if (!form.title.trim() || !form.description.trim()) { setFailure('Renseigne le titre et la description.'); return; }
    // Creating without a cover reaches the backend and fails there; say so before the round trip.
    if (!initial && !coverImageFile) { setFailure('Ajoute une image de couverture : elle est obligatoire pour créer un événement.'); return; }
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) { setFailure('Renseigne des dates valides.'); return; }
    if (localDate(start.toISOString()).slice(0, 16) !== form.startDate.slice(0, 16) || (end && localDate(end.toISOString()).slice(0, 16) !== form.endDate?.slice(0, 16))) { setFailure('Cette heure n’existe pas dans ton fuseau horaire lors du changement d’heure. Choisis une autre heure.'); return; }
    if (end && end < start) { setFailure('La date de fin ne peut pas précéder la date de début.'); return; }
    setBusy(true);
    try {
      const body = { ...form, title: form.title.trim(), description: form.description.trim(), location: form.location?.trim() || undefined, startDate: initial && form.startDate === localDate(initial.startDate) ? initial.startDate : start.toISOString(), endDate: initial && form.endDate === localDate(initial.endDate) ? initial.endDate : end?.toISOString() };
      if (initial) await adminApi.updateEvent(initial.id, body, coverImageFile ?? undefined);
      else await adminApi.createEvent(body, coverImageFile!);
      onCreated();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’enregistrement a échoué. Réessaie.');
      if (error instanceof ApiError) setFieldErrors(Object.values(error.fields ?? {}));
    } finally { setBusy(false); }
  }

  return <AdminModal open onClose={onCancel} title={initial ? 'Modifier l’événement' : 'Nouvel événement'} description="Prépare le programme, ajoute une couverture et choisis sa visibilité." busy={busy} wide>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="mb-4 font-display text-lg font-medium">01 — Le programme</legend>
        <label className="block text-sm text-t2">Titre<input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={field} /></label>
        <label className="block text-sm text-t2">Description<textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={area} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm text-t2">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as EventType })} className={field}><option value="BOOTCAMP">Bootcamp</option><option value="WORKSHOP">Atelier</option><option value="WEBINAR">Webinaire</option><option value="CONFERENCE">Conférence</option></select></label>
          <label className="block text-sm text-t2">Format<select value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value as EventFormat })} className={field}><option value="ONLINE">En ligne</option><option value="OFFLINE">Sur place</option><option value="HYBRID">Hybride</option></select></label>
        </div>
      </fieldset>

      <fieldset disabled={busy} className="space-y-5 border-t border-line-soft pt-5">
        <legend className="pr-3 font-display text-lg font-medium">02 — Image de couverture{!initial && <span className="ml-2 text-sm font-normal text-gold-400">obligatoire</span>}</legend>
        <div className="rounded-3xl border border-dashed border-line p-5">
          {coverPreview ? <div className="mb-4 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-noir-800"><img src={coverPreview} alt="Aperçu de la couverture" className="h-full w-full object-cover" /></div> : null}
          <input type="file" accept="image/*" required={!initial} onChange={(event) => handleCoverFile(event.target.files?.[0] ?? null)} className="block w-full text-sm text-t3 file:mr-4 file:min-h-11 file:rounded-full file:border-0 file:bg-noir-700 file:px-4 file:text-t1" />
          {initial && !coverImageFile && <p className="mt-2 text-xs text-t3">Laisse vide pour conserver l’image actuelle.</p>}
        </div>
      </fieldset>

      <fieldset disabled={busy} className="space-y-5 border-t border-line-soft pt-5">
        <legend className="pr-3 font-display text-lg font-medium">03 — Informations pratiques</legend>
        <p id="event-timezone" className="text-xs leading-relaxed text-t3">Dates et heures dans ton fuseau horaire : {timezone}. Elles seront enregistrées en temps universel.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm text-t2">Début<input required type="datetime-local" step="1" aria-describedby="event-timezone" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={field} /></label>
          <label className="block text-sm text-t2">Fin (facultatif)<input type="datetime-local" step="1" min={form.startDate || undefined} aria-describedby="event-timezone" value={form.endDate ?? ''} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={field} /></label>
        </div>
        <label className="block text-sm text-t2">Lieu ou lien de connexion (facultatif)<input maxLength={200} value={form.location ?? ''} onChange={(event) => setForm({ ...form, location: event.target.value })} className={field} /></label>
      </fieldset>
      <fieldset disabled={busy} className="space-y-4 border-t border-line-soft pt-5">
        <legend className="pr-3 font-display text-lg font-medium">04 — Visibilité</legend>
        <label className="block text-sm text-t2">Statut<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EventStatus })} className={field}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publié</option><option value="COMPLETED">Terminé</option><option value="CANCELLED">Annulé</option></select></label>
        <p className="text-xs text-t3">{form.status === 'PUBLISHED' ? 'En enregistrant, cet événement sera visible sur le site public.' : 'Seuls les événements publiés sont visibles sur le site public.'}</p>
      </fieldset>
      {failure && <div role="alert" className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-sm text-t1"><p>{failure}</p>{fieldErrors.length > 0 && <ul className="mt-2 list-inside list-disc">{fieldErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}</div>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-line-soft pt-5"><button type="button" disabled={busy} onClick={onCancel} className="btn-secondary">Annuler</button><button disabled={busy} className="btn-primary">{busy ? 'Enregistrement…' : form.status === 'PUBLISHED' ? 'Enregistrer et publier' : 'Enregistrer'}</button></div>
    </form>
  </AdminModal>;
}
