// src/pages/admin/AdminPremiumRequests.tsx
import { useState, useEffect, useCallback } from 'react';
import { Crown, Loader2, ChevronLeft, ChevronRight, Phone, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import adminApi, { AdminPremiumRequest, PaginatedResponse } from '@/services/adminApi';

type StatusFilter = 'ALL' | 'PENDING' | 'CONTACTED' | 'PAID' | 'REJECTED';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  PENDING: {
    label: 'En attente',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: <Clock className="w-3 h-3" />,
  },
  CONTACTED: {
    label: 'Contacté',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: <Phone className="w-3 h-3" />,
  },
  PAID: {
    label: 'Payé / Activé',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  REJECTED: {
    label: 'Refusé',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
};

const AdminPremiumRequests = () => {
  const [requests, setRequests] = useState<AdminPremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [stats, setStats] = useState<{ pending: number; contacted: number; paid: number; rejected: number } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'ALL' ? undefined : statusFilter;
      const data: PaginatedResponse<AdminPremiumRequest> = await adminApi.getPremiumRequests(page, 20, filter);
      setRequests(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error('Error loading premium requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    adminApi.getPremiumStats().then(setStats).catch(() => {});
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const updated = await adminApi.updatePremiumRequestStatus(id, newStatus);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      adminApi.getPremiumStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
          <Crown className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Demandes Premium</h2>
          <p className="text-sm text-gray-500">{totalElements} demande{totalElements !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'En attente', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50 border border-yellow-100' },
            { label: 'Contactés', value: stats.contacted, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
            { label: 'Activés', value: stats.paid, color: 'text-green-600', bg: 'bg-green-50 border border-green-100' },
            { label: 'Refusés', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50 border border-red-100' },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 rounded-xl ${stat.bg}`}>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'CONTACTED', 'PAID', 'REJECTED'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-gold text-black'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Toutes' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <Crown className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pays</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => {
                  const statusInfo = STATUS_CONFIG[req.status];
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{req.username}</p>
                        <p className="text-xs text-gray-500">{req.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://wa.me/${req.whatsappNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {req.whatsappNumber}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{req.country}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {req.message || <span className="italic text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusInfo?.color}`}>
                          {statusInfo?.icon}
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        {updatingId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gold" />
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {req.status !== 'CONTACTED' && req.status !== 'PAID' && req.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'CONTACTED')}
                                className="px-2 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              >
                                Contacté
                              </button>
                            )}
                            {req.status !== 'PAID' && req.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'PAID')}
                                className="px-2 py-1 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-semibold"
                              >
                                Activer Premium
                              </button>
                            )}
                            {req.status !== 'REJECTED' && req.status !== 'PAID' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                Refuser
                              </button>
                            )}
                            {(req.status === 'PAID' || req.status === 'REJECTED') && (
                              <span className="text-xs text-gray-400 italic">Terminé</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Page {page + 1} sur {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPremiumRequests;
