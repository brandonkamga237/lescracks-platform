// src/pages/admin/AdminEvents.tsx
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Pencil, X, Save, Image } from 'lucide-react';
import { PageHeader } from '@/components/admin/viz';
import AsyncState from '@/components/ui/AsyncState';
import Pagination from '@/components/ui/Pagination';
import adminApi, { AdminEvent, PaginatedResponse, AdminEventPayload } from '@/services/adminApi';
import { deriveEventStatus } from '@/lib/eventStatus';
import apiService from '@/services/api';

import { errorMessage } from '@/lib/utils';
interface EventType   { id: number; name: string; }
interface EventStatus { id: number; name: string; }

interface EventForm {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  coverImageUrl: string;
  applicationRequired: boolean;
  maxParticipants: number | '';
  eventTypeId: number | '';
  eventStatusId: number | '';
}

const EMPTY: EventForm = {
  title: '', description: '',
  startDate: '', startTime: '',
  endDate: '',  endTime: '',
  location: '', coverImageUrl: '',
  applicationRequired: false,
  maxParticipants: '',
  eventTypeId: '', eventStatusId: '',
};

const STATUS_LABELS: Record<string, string> = { open: 'Ouvert', upcoming: 'À venir', closed: 'Fermé' };
const STATUS_COLORS: Record<string, string> = {
  open:     'bg-success-subtle text-success',
  upcoming: 'bg-info-subtle text-info',
  closed:   'bg-surface-2 text-t3',
};
const TYPE_COLORS: Record<string, string> = {
  BOOTCAMP:  'bg-info-subtle text-info',
  HACKATHON: 'bg-info-subtle text-info',
  MEETUP:    'bg-info-subtle text-info',
  WORKSHOP:  'bg-warning-subtle text-warning',
};

/** Combine a date string + optional time into a LocalDateTime string */
const toDateTime = (date: string, time: string): string => {
  if (!date) return '';
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
};

/** Extract the date part (YYYY-MM-DD) from an ISO datetime string */
const dateOf = (iso?: string) => (iso ? iso.substring(0, 10) : '');
/** Extract HH:MM from an ISO datetime, returns '' if midnight */
const timeOf = (iso?: string) => {
  if (!iso) return '';
  const t = iso.substring(11, 16);
  return t === '00:00' ? '' : t;
};

const AdminEvents = () => {
  const [events, setEvents]               = useState<AdminEvent[]>([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<AdminEvent | null>(null);
  const [form, setForm]           = useState<EventForm>(EMPTY);

  // Preview the status the API will compute, using the SAME rule as the backend.
  const derivedStatus = deriveEventStatus(
    form.startDate ? toDateTime(form.startDate, form.startTime) : null,
    form.endDate ? toDateTime(form.endDate, form.endTime) : null,
  );
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);

  const [eventTypes,    setEventTypes]    = useState<EventType[]>([]);
  const [eventStatuses, setEventStatuses] = useState<EventStatus[]>([]);
  const [metaLoaded, setMetaLoaded]       = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getEventTypes(), adminApi.getEventStatuses()])
      .then(([types, statuses]) => { setEventTypes(types); setEventStatuses(statuses); })
      .catch(console.error)
      .finally(() => setMetaLoaded(true));
  }, []);

  useEffect(() => { fetchEvents(); }, [page]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<AdminEvent> = await adminApi.getEvents(page, 20);
      setEvents(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true);
  };

  const openEdit = (ev: AdminEvent) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description || '',
      startDate: dateOf(ev.startDate),
      startTime: timeOf(ev.startDate),
      endDate:   dateOf(ev.endDate),
      endTime:   timeOf(ev.endDate),
      location:  ev.location || '',
      coverImageUrl: ev.coverImageUrl || '',
      applicationRequired: ev.applicationRequired ?? false,
      maxParticipants: ev.maxParticipants ?? '',
      eventTypeId:   eventTypes.find(t => t.name === ev.type)?.id   ?? '',
      eventStatusId: eventStatuses.find(s => s.name === ev.status)?.id ?? '',
    });
    setError(''); setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await apiService.uploadImage(file);
      setForm(f => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'upload de l'image"));
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim())       { setError('Le titre est obligatoire.'); return; }
    if (!form.startDate)          { setError('La date de début est obligatoire.'); return; }
    if (form.eventTypeId === '')  { setError('Le type est obligatoire.'); return; }

    setSaving(true); setError('');
    try {
      const payload: AdminEventPayload = {
        title:               form.title,
        description:         form.description || undefined,
        eventDate:           toDateTime(form.startDate, form.startTime),
        endDate:             form.endDate ? toDateTime(form.endDate, form.endTime) : undefined,
        location:            form.location || undefined,
        coverImageUrl:       form.coverImageUrl || undefined,
        applicationRequired: form.applicationRequired,
        // Empty means "no limit" — send null rather than 0, which would read as "full".
        maxParticipants:     form.maxParticipants === '' ? null : Number(form.maxParticipants),
        eventTypeId:         form.eventTypeId as number,
        // eventStatusId is deliberately not sent: the API derives the status from the dates.
      };
      if (editing) {
        await adminApi.updateEvent(editing.id, payload);
      } else {
        await adminApi.createEvent(payload);
      }
      setShowModal(false);
      fetchEvents();
    } catch (e) {
      setError(errorMessage(e, 'Erreur lors de la sauvegarde.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      setTotalElements(n => n - 1);
    } catch { alert('Erreur lors de la suppression.'); }
  };

  const set = (k: keyof EventForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <PageHeader title="Événements"
        subtitle={`${totalElements} événement${totalElements !== 1 ? 's' : ''}`}
        actions={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors font-medium text-data">
            <Plus className="w-4 h-4" />
            Nouvel événement
          </button>
        } />

      {/* Table */}
      <div className="bg-surface-1 rounded-xl border border-line overflow-hidden">
        <AsyncState
          loading={loading}
          empty={events.length === 0}
          emptyLabel="Aucun événement. Créez-en un pour commencer."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-data">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-left text-label text-t3 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-label text-t3 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-label text-t3 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-label text-t3 uppercase">Dates</th>
                  <th className="px-4 py-3 text-right text-label text-t3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ev.coverImageUrl ? (
                          <img src={ev.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                            <Image className="w-5 h-5 text-t4" />
                          </div>
                        )}
                        <span className="font-medium text-t1">{ev.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-data rounded-full font-medium ${TYPE_COLORS[ev.type] ?? 'bg-surface-2 text-t3'}`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-data rounded-full font-medium ${STATUS_COLORS[ev.status] ?? 'bg-surface-2 text-t3'}`}>
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-t3 text-data">
                      {formatDate(ev.startDate)}
                      {ev.endDate && <> → {formatDate(ev.endDate)}</>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(ev)}
                          className="p-1.5 rounded-lg text-gold hover:bg-gold/10 transition-colors" title="Modifier">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)}
                          className="p-1.5 rounded-lg text-error hover:bg-error-subtle transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-1 rounded-xl w-full max-w-xl border border-line max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-surface-1 z-10">
              <h2 className="text-heading text-t1">
                {editing ? "Modifier l'événement" : 'Nouvel événement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-t4 hover:text-t1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="bg-error-subtle border border-error/30 text-error text-data rounded-lg px-4 py-3">{error}</div>
              )}

              {/* Cover image */}
              <div>
                <label className="block text-data font-medium text-t2 mb-2">Image de couverture</label>
                <div className="flex items-start gap-4">
                  {form.coverImageUrl ? (
                    <div className="relative flex-shrink-0">
                      <img src={form.coverImageUrl} alt="" className="w-24 h-16 object-cover rounded-lg border border-line" />
                      <button
                        onClick={() => setForm(f => ({ ...f, coverImageUrl: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-error text-error-foreground rounded-full flex items-center justify-center text-data"
                      >×</button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-surface-2 border-2 border-dashed border-line flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-t4" />
                    </div>
                  )}
                  <label className="cursor-pointer bg-surface-2 hover:bg-surface-3 text-t2 text-data px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    {uploading ? 'Upload...' : 'Choisir une image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-data font-medium text-t2 mb-1">Titre *</label>
                <input type="text" value={form.title} onChange={set('title')}
                  placeholder="Ex : Hackathon IA Yaoundé 2025"
                  className="w-full border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-data font-medium text-t2 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  placeholder="Décrivez l'événement..."
                  className="w-full border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none resize-none" />
              </div>

              {/* Date début */}
              <div>
                <label className="block text-data font-medium text-t2 mb-1">Date de début *</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.startDate} onChange={set('startDate')}
                    className="border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
                  <div className="relative">
                    <input type="time" value={form.startTime} onChange={set('startTime')}
                      placeholder="Heure (optionnelle)"
                      className="w-full border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-data text-t4 pointer-events-none">
                      {form.startTime ? '' : 'optionnel'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-data font-medium text-t2 mb-1">
                  Date de fin <span className="text-t4 font-normal">(optionnelle — pour une plage)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.endDate} onChange={set('endDate')}
                    min={form.startDate || undefined}
                    className="border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
                  <input type="time" value={form.endTime} onChange={set('endTime')} disabled={!form.endDate}
                    className="border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none disabled:opacity-40" />
                </div>
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-data font-medium text-t2 mb-1">
                  Lieu <span className="text-t4 font-normal">(optionnel)</span>
                </label>
                <input type="text" value={form.location} onChange={set('location')}
                  placeholder="Ex : Yaoundé / En ligne / ESSTIC"
                  className="w-full border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
              </div>

              {/* Type + Statut (calculé) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-data font-medium text-t2 mb-1">Type *</label>
                  <select value={form.eventTypeId} onChange={set('eventTypeId')} disabled={!metaLoaded}
                    className="w-full border border-line rounded-lg px-3 py-2 text-data focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none">
                    <option value="">— Choisir —</option>
                    {eventTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  {/* The status used to be picked by hand, which meant it was right on the day
                      you set it and wrong the morning after. It now follows the dates. */}
                  <label className="block text-data font-medium text-t2 mb-1">Statut</label>
                  <div className="w-full border border-line bg-surface-2 rounded-lg px-3 py-2 text-data text-t3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      derivedStatus === 'open' ? 'bg-success'
                      : derivedStatus === 'upcoming' ? 'bg-info' : 'bg-t4'}`} />
                    {STATUS_LABELS[derivedStatus] ?? derivedStatus}
                    <span className="ml-auto text-data text-t4">automatique</span>
                  </div>
                  <p className="text-data text-t3 mt-1">
                    Déduit des dates. L'événement s'ouvre et se ferme tout seul.
                  </p>
                </div>
              </div>

              {/* Places */}
              <div>
                <label htmlFor="ev-max" className="block text-data font-medium text-t2 mb-1.5">
                  Nombre de places
                </label>
                <input
                  id="ev-max"
                  type="number"
                  min={1}
                  value={form.maxParticipants}
                  onChange={e => setForm(f => ({
                    ...f,
                    maxParticipants: e.target.value === '' ? '' : Number(e.target.value),
                  }))}
                  placeholder="Laisser vide = illimité"
                  className="w-full px-3 py-2 border border-line rounded-lg text-data focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <p className="text-data text-t3 mt-1">
                  Quand les places sont prises, la page affiche « Complet » et l'inscription se ferme.
                </p>
              </div>

              {/* Candidature */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.applicationRequired}
                  onChange={e => setForm(f => ({ ...f, applicationRequired: e.target.checked }))}
                  className="w-4 h-4 accent-gold" />
                <span className="text-data text-t2">Candidature requise pour participer</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line sticky bottom-0 bg-surface-1">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-data text-t3 hover:text-t1 border border-line rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-data bg-gold text-black font-medium rounded-lg hover:bg-gold/80 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
