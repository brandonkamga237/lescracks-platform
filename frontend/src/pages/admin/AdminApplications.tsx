// src/pages/admin/AdminApplications.tsx
import { useState, useEffect } from 'react';
import {
  ClipboardList, Loader2, Trash2, CheckCircle, XCircle, Clock,
  Eye, X, Phone, Mail, User, Calendar, MessageSquare,
} from 'lucide-react';
import adminApi, { AdminApplication } from '@/services/adminApi';

const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <Clock className="w-3 h-3" />,
  },
  accepted: {
    label: 'Accepté',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  rejected: {
    label: 'Refusé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
};

const AdminApplications = () => {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [detailApp, setDetailApp] = useState<AdminApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const updated = await adminApi.updateApplicationStatus(id, newStatus);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: updated.status } : a));
      if (detailApp?.id === id) setDetailApp(prev => prev ? { ...prev, status: updated.status } : null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number, status: string) => {
    if (status === 'accepted') return;
    if (!confirm('Supprimer cette candidature ?')) return;
    try {
      await adminApi.deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
      if (detailApp?.id === id) setDetailApp(null);
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const filtered = applications.filter(a =>
    filterStatus === 'all' || a.status === filterStatus
  );

  const displayName = (app: AdminApplication) =>
    app.fullName || app.username || `Candidat #${app.id}`;

  const displayEmail = (app: AdminApplication) =>
    app.emailAddress || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidatures</h2>
          <p className="text-sm text-gray-500">
            {stats.total} candidature{stats.total !== 1 ? 's' : ''} — Accompagnement 360
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50 border border-gray-200' },
          { label: 'En attente', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50 border border-yellow-100' },
          { label: 'Acceptés', value: stats.accepted, color: 'text-green-600', bg: 'bg-green-50 border border-green-100' },
          { label: 'Refusés', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50 border border-red-100' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'accepted', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-gold text-black'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Tous' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">Aucune candidature trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">WhatsApp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(app => {
                  const statusInfo = STATUS_CONFIG[app.status];
                  const canDelete = app.status !== 'accepted';

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{displayName(app)}</p>
                        {app.age && <p className="text-xs text-gray-400">{app.age} ans</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{displayEmail(app)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.whatsappNumber || <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        {updatingId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gold" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {/* Voir détail */}
                            <button
                              onClick={() => setDetailApp(app)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Voir la candidature"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Accepter */}
                            {app.status !== 'accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'accepted')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Accepter"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {/* Refuser */}
                            {app.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                                title="Refuser"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {/* Supprimer — désactivé si accepté */}
                            <button
                              onClick={() => handleDelete(app.id, app.status)}
                              disabled={!canDelete}
                              className={`p-1.5 rounded-lg transition-colors ${
                                canDelete
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={canDelete ? 'Supprimer' : 'Impossible de supprimer une candidature acceptée'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </div>

      {/* Modal détail */}
      {detailApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{displayName(detailApp)}</h3>
                <p className="text-xs text-gray-400">
                  Candidature du {new Date(detailApp.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <button onClick={() => setDetailApp(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenu */}
            <div className="px-6 py-5 space-y-4">
              {/* Statut */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${STATUS_CONFIG[detailApp.status].color}`}>
                  {STATUS_CONFIG[detailApp.status].icon}
                  {STATUS_CONFIG[detailApp.status].label}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {[
                  { icon: <User className="w-4 h-4" />, label: 'Nom complet', value: detailApp.fullName },
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: detailApp.emailAddress },
                  { icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', value: detailApp.whatsappNumber },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Âge', value: detailApp.age ? `${detailApp.age} ans` : null },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-3">
                    <span className="text-gray-400 flex-shrink-0">{row.icon}</span>
                    <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                    <span className="text-sm text-gray-900 font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Motivation */}
              {detailApp.motivationText && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">Motivation</p>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                    {detailApp.motivationText}
                  </p>
                </div>
              )}
            </div>

            {/* Actions modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              {detailApp.status !== 'accepted' && (
                <button
                  onClick={() => handleStatusUpdate(detailApp.id, 'accepted')}
                  disabled={updatingId === detailApp.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {updatingId === detailApp.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  Accepter
                </button>
              )}
              {detailApp.status !== 'rejected' && (
                <button
                  onClick={() => handleStatusUpdate(detailApp.id, 'rejected')}
                  disabled={updatingId === detailApp.id}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {updatingId === detailApp.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <XCircle className="w-4 h-4" />}
                  Refuser
                </button>
              )}
              <button
                onClick={() => setDetailApp(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
