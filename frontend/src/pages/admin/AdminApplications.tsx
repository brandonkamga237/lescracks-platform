// src/pages/admin/AdminApplications.tsx
import { useState, useEffect } from 'react';
import { ClipboardList, Loader2, Trash2, CheckCircle, XCircle, Clock, Eye, ChevronDown } from 'lucide-react';
import adminApi, { AdminApplication } from '@/services/adminApi';

const TYPE_LABELS: Record<string, string> = {
  accompagnement_360: 'Accompagnement 360°',
  formation_classique: 'Formation Classique',
  apply: 'Candidature',
  register: 'Inscription',
  participate: 'Participation',
};

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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

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
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette candidature ?')) return;
    try {
      await adminApi.deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  // Unique types
  const types = [...new Set(applications.map(a => a.applicationTypeName))];

  // Filtered
  const filtered = applications.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchType = filterType === 'all' || a.applicationTypeName === filterType;
    return matchStatus && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidatures</h2>
          <p className="text-sm text-gray-500">{stats.total} candidature{stats.total !== 1 ? 's' : ''} reçue{stats.total !== 1 ? 's' : ''}</p>
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
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {['all', 'pending', 'accepted', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s ? 'bg-gold text-black' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
            </button>
          ))}
        </div>

        {types.length > 1 && (
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="all">Tous les types</option>
            {types.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        )}
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Candidat</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Programme</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Événement</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Niveau</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(app => {
                  const statusInfo = STATUS_CONFIG[app.status];
                  const isExpanded = expandedId === app.id;

                  return (
                    <>
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 text-sm">{app.username}</p>
                          <p className="text-xs text-gray-400">ID: {app.userId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                            {TYPE_LABELS[app.applicationTypeName] || app.applicationTypeName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {app.eventTitle || <span className="text-gray-300 italic">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {app.technicalLevel || <span className="text-gray-300 italic">—</span>}
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
                              {/* Voir motivation */}
                              {app.motivationText && (
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Voir la lettre de motivation"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              {/* Accept */}
                              {app.status !== 'accepted' && (
                                <button
                                  onClick={() => handleStatusUpdate(app.id, 'accepted')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Accepter"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {/* Reject */}
                              {app.status !== 'rejected' && (
                                <button
                                  onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                                  title="Refuser"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(app.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Expanded motivation */}
                      {isExpanded && app.motivationText && (
                        <tr key={`${app.id}-expanded`} className="bg-blue-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <ChevronDown className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Lettre de motivation</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.motivationText}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;
