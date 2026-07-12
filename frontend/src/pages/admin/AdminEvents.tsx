// src/pages/admin/AdminEvents.tsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, Trash2, Pencil, ChevronLeft, ChevronRight, X, Save, Image } from 'lucide-react';
import adminApi, { AdminEvent, PaginatedResponse } from '@/services/adminApi';
import apiService from '@/services/api';

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
  eventTypeId: number | '';
  eventStatusId: number | '';
}

const EMPTY: EventForm = {
  title: '', description: '',
  startDate: '', startTime: '',
  endDate: '',  endTime: '',
  location: '', coverImageUrl: '',
  applicationRequired: false,
  eventTypeId: '', eventStatusId: '',
};

const STATUS_LABELS: Record<string, string> = { open: 'Ouvert', upcoming: 'À venir', closed: 'Fermé' };
const STATUS_COLORS: Record<string, string> = {
  open:     'bg-green-100 text-green-700',
  upcoming: 'bg-blue-100 text-blue-700',
  closed:   'bg-gray-100 text-gray-600',
};
const TYPE_COLORS: Record<string, string> = {
  BOOTCAMP:  'bg-purple-100 text-purple-700',
  HACKATHON: 'bg-pink-100 text-pink-700',
  MEETUP:    'bg-blue-100 text-blue-700',
  WORKSHOP:  'bg-yellow-100 text-yellow-700',
  FORMATION: 'bg-green-100 text-green-700',
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
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload de l'image");
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim())       { setError('Le titre est obligatoire.'); return; }
    if (!form.startDate)          { setError('La date de début est obligatoire.'); return; }
    if (form.eventTypeId === '')  { setError('Le type est obligatoire.'); return; }
    if (form.eventStatusId === '') { setError('Le statut est obligatoire.'); return; }

    setSaving(true); setError('');
    try {
      const payload: any = {
        title:               form.title,
        description:         form.description || undefined,
        eventDate:           toDateTime(form.startDate, form.startTime),
        endDate:             form.endDate ? toDateTime(form.endDate, form.endTime) : undefined,
        location:            form.location || undefined,
        coverImageUrl:       form.coverImageUrl || undefined,
        applicationRequired: form.applicationRequired,
        eventTypeId:         form.eventTypeId as number,
        eventStatusId:       form.eventStatusId as number,
      };
      if (editing) {
        await adminApi.updateEvent(editing.id, payload);
      } else {
        await adminApi.createEvent(payload);
      }
      setShowModal(false);
      fetchEvents();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde.');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Événements</h2>
          <p className="text-gray-500 text-sm">{totalElements} événement{totalElements !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors font-semibold">
          <Plus className="w-4 h-4" /> Nouvel événement
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <Calendar className="w-12 h-12 opacity-30" />
            <p>Aucun événement. Créez-en un !</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dates</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ev.coverImageUrl ? (
                          <img src={ev.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Image className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{ev.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${TYPE_COLORS[ev.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[ev.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
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
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} sur {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Modifier l'événement" : 'Nouvel événement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
              )}

              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image de couverture</label>
                <div className="flex items-start gap-4">
                  {form.coverImageUrl ? (
                    <div className="relative flex-shrink-0">
                      <img src={form.coverImageUrl} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                      <button
                        onClick={() => setForm(f => ({ ...f, coverImageUrl: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >×</button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    {uploading ? 'Upload...' : 'Choisir une image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={form.title} onChange={set('title')}
                  placeholder="Ex : Hackathon IA Yaoundé 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  placeholder="Décrivez l'événement..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none resize-none" />
              </div>

              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.startDate} onChange={set('startDate')}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
                  <div className="relative">
                    <input type="time" value={form.startTime} onChange={set('startTime')}
                      placeholder="Heure (optionnelle)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      {form.startTime ? '' : 'optionnel'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin <span className="text-gray-400 font-normal">(optionnelle — pour une plage)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.endDate} onChange={set('endDate')}
                    min={form.startDate || undefined}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
                  <input type="time" value={form.endTime} onChange={set('endTime')} disabled={!form.endDate}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none disabled:opacity-40" />
                </div>
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input type="text" value={form.location} onChange={set('location')}
                  placeholder="Ex : Yaoundé / En ligne / ESSTIC"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none" />
              </div>

              {/* Type + Statut */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.eventTypeId} onChange={set('eventTypeId')} disabled={!metaLoaded}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none">
                    <option value="">— Choisir —</option>
                    {eventTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                  <select value={form.eventStatusId} onChange={set('eventStatusId')} disabled={!metaLoaded}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none">
                    <option value="">— Choisir —</option>
                    {eventStatuses.map(s => (
                      <option key={s.id} value={s.id}>{STATUS_LABELS[s.name] ?? s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Candidature */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.applicationRequired}
                  onChange={e => setForm(f => ({ ...f, applicationRequired: e.target.checked }))}
                  className="w-4 h-4 accent-gold" />
                <span className="text-sm text-gray-700">Candidature requise pour participer</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors disabled:opacity-60">
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
