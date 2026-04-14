// src/pages/admin/AdminEvents.tsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, Trash2, Pencil, MapPin, Users, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import adminApi, { AdminEvent, PaginatedResponse } from '@/services/adminApi';

interface EventType { id: number; name: string; }
interface EventStatus { id: number; name: string; }

interface EventForm {
  title: string;
  description: string;
  eventDate: string;
  applicationRequired: boolean;
  eventTypeId: number | '';
  eventStatusId: number | '';
}

const EMPTY_FORM: EventForm = {
  title: '',
  description: '',
  eventDate: '',
  applicationRequired: false,
  eventTypeId: '',
  eventStatusId: '',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  upcoming: 'À venir',
  closed: 'Fermé',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  upcoming: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
};

const TYPE_COLORS: Record<string, string> = {
  BOOTCAMP: 'bg-purple-100 text-purple-700',
  HACKATHON: 'bg-pink-100 text-pink-700',
  MEETUP: 'bg-blue-100 text-blue-700',
  WORKSHOP: 'bg-yellow-100 text-yellow-700',
  FORMATION: 'bg-green-100 text-green-700',
};

const AdminEvents = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventStatuses, setEventStatuses] = useState<EventStatus[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Load event types and statuses once
  useEffect(() => {
    Promise.all([adminApi.getEventTypes(), adminApi.getEventStatuses()])
      .then(([types, statuses]) => {
        setEventTypes(types);
        setEventStatuses(statuses);
      })
      .catch(console.error)
      .finally(() => setMetaLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [page]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<AdminEvent> = await adminApi.getEvents(page, 20);
      setEvents(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error('Error loading events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (ev: AdminEvent) => {
    setEditing(ev);
    // Find matching type/status IDs by name
    const typeId = eventTypes.find(t => t.name === ev.type)?.id ?? '';
    const statusId = eventStatuses.find(s => s.name === ev.status)?.id ?? '';
    setForm({
      title: ev.title,
      description: ev.description || '',
      eventDate: ev.startDate ? ev.startDate.substring(0, 16) : '',
      applicationRequired: false,
      eventTypeId: typeId,
      eventStatusId: statusId,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!form.eventDate) { setError('La date est obligatoire.'); return; }
    if (form.eventTypeId === '') { setError('Le type est obligatoire.'); return; }
    if (form.eventStatusId === '') { setError('Le statut est obligatoire.'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        eventDate: form.eventDate + ':00',  // LocalDateTime format
        applicationRequired: form.applicationRequired,
        eventTypeId: form.eventTypeId as number,
        eventStatusId: form.eventStatusId as number,
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      setTotalElements(n => n - 1);
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const f = (k: keyof EventForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Événements</h2>
          <p className="text-gray-500 text-sm">{totalElements} événement{totalElements !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors font-semibold"
        >
          <Plus className="w-4 h-4" />
          Nouvel événement
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
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
                    <td className="px-4 py-3 text-gray-600">
                      {ev.startDate ? new Date(ev.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(ev)}
                          className="p-1.5 rounded-lg text-gold hover:bg-gold/10 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
              )}

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={f('title')}
                  placeholder="Ex : Hackathon IA Yaoundé 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={f('description')}
                  rows={3}
                  placeholder="Décrivez l'événement..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & heure *</label>
                <input
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={f('eventDate')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                />
              </div>

              {/* Type + Statut */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.eventTypeId}
                    onChange={f('eventTypeId')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                    disabled={metaLoading}
                  >
                    <option value="">— Choisir —</option>
                    {eventTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                  <select
                    value={form.eventStatusId}
                    onChange={f('eventStatusId')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                    disabled={metaLoading}
                  >
                    <option value="">— Choisir —</option>
                    {eventStatuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {STATUS_LABELS[s.name] ?? s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Candidature requise */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.applicationRequired}
                  onChange={e => setForm(prev => ({ ...prev, applicationRequired: e.target.checked }))}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm text-gray-700">Candidature requise pour participer</span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors disabled:opacity-60"
              >
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
