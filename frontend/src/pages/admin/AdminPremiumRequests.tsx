// src/pages/admin/AdminPremiumRequests.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Crown, Loader2, ChevronLeft, ChevronRight,
  CheckCircle, Trash2, MessageCircle, Mail, X,
} from 'lucide-react';
import adminApi, { AdminPremiumRequest, PaginatedResponse } from '@/services/adminApi';

const DURATION_OPTIONS = [1, 2, 3, 6, 12, 24];

const AdminPremiumRequests = () => {
  const [requests, setRequests] = useState<AdminPremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState<{ pending: number } | null>(null);

  // Accept modal
  const [acceptTarget, setAcceptTarget] = useState<AdminPremiumRequest | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  // Reject confirm
  const [rejectTarget, setRejectTarget] = useState<AdminPremiumRequest | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<AdminPremiumRequest> = await adminApi.getPremiumRequests(page, 20);
      setRequests(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error('Error loading premium requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const refreshStats = () => {
    adminApi.getPremiumStats().then(setStats).catch(() => {});
  };

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { refreshStats(); }, []);

  const handleAccept = async () => {
    if (!acceptTarget) return;
    setAccepting(true);
    setAcceptError('');
    try {
      await adminApi.acceptPremiumRequest(acceptTarget.id, selectedMonths);
      setRequests((prev) => prev.filter((r) => r.id !== acceptTarget.id));
      setTotalElements((n) => n - 1);
      setAcceptTarget(null);
      refreshStats();
    } catch (err: any) {
      setAcceptError(err?.message || 'Une erreur est survenue');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await adminApi.rejectPremiumRequest(rejectTarget.id);
      setRequests((prev) => prev.filter((r) => r.id !== rejectTarget.id));
      setTotalElements((n) => n - 1);
      setRejectTarget(null);
      refreshStats();
    } catch (err) {
      console.error('Error rejecting request:', err);
    } finally {
      setRejecting(false);
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
          <p className="text-sm text-gray-500">{totalElements} demande{totalElements !== 1 ? 's' : ''} en attente</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600 mt-1">En attente de traitement</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <Crown className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pays</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
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
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${req.contactEmail}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {req.contactEmail}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{req.country}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {req.message || <span className="italic text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setAcceptTarget(req); setSelectedMonths(3); setAcceptError(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-semibold"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accepter
                        </button>
                        <button
                          onClick={() => setRejectTarget(req)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Accept modal */}
      {acceptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Activer le compte PREMIUM</h3>
              <button onClick={() => setAcceptTarget(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              Utilisateur : <strong className="text-gray-900">{acceptTarget.username}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-1">
              WhatsApp : <strong className="text-gray-900">{acceptTarget.whatsappNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-5">
              Email de confirmation : <strong className="text-gray-900">{acceptTarget.contactEmail}</strong>
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée de l'abonnement
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {DURATION_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonths(m)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedMonths === m
                      ? 'bg-gold border-gold text-black'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m} mois
                </button>
              ))}
            </div>

            {acceptError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {acceptError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setAcceptTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Activer {selectedMonths} mois
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject confirm modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Supprimer la demande</h3>
              <button onClick={() => setRejectTarget(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Supprimer la demande de <strong className="text-gray-900">{rejectTarget.username}</strong> ?
              Le refus est géré directement sur WhatsApp — aucun email ne sera envoyé.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPremiumRequests;
