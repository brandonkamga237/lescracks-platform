// src/pages/admin/AdminEvents.tsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, Trash2, Eye, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import adminApi, { AdminEvent, PaginatedResponse } from '@/services/adminApi';

const AdminEvents = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
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
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet evenement?')) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Erreur lors de la suppression de l\'événement');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Ouvert</span>;
      case 'upcoming':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">À venir</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Fermé</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BOOTCAMP: 'bg-purple-100 text-purple-700',
      HACKATHON: 'bg-pink-100 text-pink-700',
      MEETUP: 'bg-blue-100 text-blue-700',
      WORKSHOP: 'bg-gold/20 text-gold',
      FORMATION: 'bg-green-100 text-green-700',
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[type] || 'bg-gray-100 text-gray-700'}`}>{type}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Evenements</h2>
          <p className="text-gray-500 text-sm">{totalElements} evenement{totalElements !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/events?action=new'}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel Evenement
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{event.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location || 'En ligne'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(event.type)}</td>
                    <td className="px-6 py-4">{getStatusBadge(event.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {event.startDate} - {event.endDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {event.currentParticipants || 0}/{event.maxParticipants || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
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
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} sur {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
