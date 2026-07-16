// src/pages/admin/AdminApplications.tsx
//
// A registry, not a pipeline. The seven-stage funnel is gone — what the admin
// actually needs is to list candidates and, at will, archive or delete them.
//
// Two populations that used to be mixed are kept strictly apart:
//   - Accompagnement 360 applications (no event)
//   - Event registrations (tied to an event)
// You look at one stream at a time.

import { useState, useEffect } from 'react';
import {
  ClipboardList, Loader2, Trash2, Eye, X, Phone, Mail, User, Calendar,
  MessageSquare, Archive, ArchiveRestore, Ticket, Compass,
} from 'lucide-react';
import adminApi, { AdminApplication } from '@/services/adminApi';

type Stream = '360' | 'events';

const AdminApplications = () => {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailApp, setDetailApp] = useState<AdminApplication | null>(null);

  const [stream, setStream] = useState<Stream>('360');
  const [eventFilter, setEventFilter] = useState<number | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      setApplications(await adminApi.getApplications());
    } catch (err) {
      console.error('Error loading applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const patch = (updated: AdminApplication) =>
    setApplications(prev => prev.map(a => (a.id === updated.id ? updated : a)));

  const handleArchive = async (app: AdminApplication) => {
    setBusyId(app.id);
    try {
      const updated = app.archived
        ? await adminApi.unarchiveApplication(app.id)
        : await adminApi.archiveApplication(app.id);
      patch(updated);
      if (detailApp?.id === app.id) setDetailApp(updated);
    } catch (err) {
      console.error('Error archiving:', err);
      alert("L'action a échoué. Merci de réessayer.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement cette candidature ? Cette action est irréversible.')) return;
    setBusyId(id);
    try {
      await adminApi.deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
      if (detailApp?.id === id) setDetailApp(null);
    } catch (err) {
      console.error('Error deleting:', err);
      alert('La suppression a échoué.');
    } finally {
      setBusyId(null);
    }
  };

  // ── Split the two populations, count the active ones for the tab badges. ──
  const is360 = (a: AdminApplication) => !a.eventRegistration;
  const activeCount = (list: AdminApplication[]) => list.filter(a => !a.archived).length;
  const stream360 = applications.filter(is360);
  const streamEvents = applications.filter(a => a.eventRegistration);
  const base = stream === '360' ? stream360 : streamEvents;

  // Distinct events, for the per-event filter.
  const eventsInStream = Array.from(
    new Map(streamEvents.filter(a => a.eventId != null)
      .map(a => [a.eventId!, a.eventTitle || `Événement #${a.eventId}`])).entries()
  );

  const rows = base.filter(a => {
    if (!showArchived && a.archived) return false;
    if (stream === 'events' && eventFilter !== 'all' && a.eventId !== eventFilter) return false;
    return true;
  });

  const archivedInStream = base.filter(a => a.archived).length;
  const displayName = (a: AdminApplication) => a.fullName || a.username || `Candidat #${a.id}`;

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
            {stream === '360'
              ? `${activeCount(stream360)} candidature${activeCount(stream360) !== 1 ? 's' : ''} active${activeCount(stream360) !== 1 ? 's' : ''} — Accompagnement 360`
              : `${activeCount(streamEvents)} inscription${activeCount(streamEvents) !== 1 ? 's' : ''} active${activeCount(streamEvents) !== 1 ? 's' : ''} aux événements`}
          </p>
        </div>
      </div>

      {/* Stream switch — 360 and events are separate registries. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {([
            { key: '360' as const,    label: 'Accompagnement 360', icon: Compass, n: activeCount(stream360) },
            { key: 'events' as const, label: 'Inscriptions événements', icon: Ticket, n: activeCount(streamEvents) },
          ]).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setStream(t.key); setEventFilter('all'); setShowArchived(false); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  stream === t.key ? 'bg-gold text-black' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className="ml-1 text-xs opacity-70 tabular-nums">{t.n}</span>
              </button>
            );
          })}
        </div>

        {stream === 'events' && eventsInStream.length > 0 && (
          <select
            value={String(eventFilter)}
            onChange={e => setEventFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
          >
            <option value="all">Tous les événements</option>
            {eventsInStream.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
        )}

        {archivedInStream > 0 && (
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none ml-auto">
            <input type="checkbox" checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="w-4 h-4 accent-gold" />
            Afficher les archivées ({archivedInStream})
          </label>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">
              {stream === '360' ? 'Aucune candidature' : 'Aucune inscription'} pour l'instant
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  {stream === 'events' && (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Événement</th>
                  )}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">WhatsApp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map(app => (
                  <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${app.archived ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{displayName(app)}</p>
                        {app.archived && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                            Archivée
                          </span>
                        )}
                      </div>
                      {app.age && <p className="text-xs text-gray-400">{app.age} ans</p>}
                    </td>
                    {stream === 'events' && (
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {app.eventTitle || <span className="text-gray-300 italic">—</span>}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">{app.emailAddress || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {app.whatsappNumber || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      {busyId === app.id ? (
                        <div className="flex justify-end"><Loader2 className="w-4 h-4 animate-spin text-gold" /></div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailApp(app)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Voir">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleArchive(app)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title={app.archived ? 'Désarchiver' : 'Archiver'}>
                            {app.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setDetailApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{displayName(detailApp)}</h3>
                <p className="text-xs text-gray-400">
                  {detailApp.eventRegistration
                    ? `Inscription — ${detailApp.eventTitle || 'Événement'}`
                    : 'Accompagnement 360'}
                  {' · '}
                  {new Date(detailApp.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setDetailApp(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
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

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => handleArchive(detailApp)}
                disabled={busyId === detailApp.id}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {detailApp.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                {detailApp.archived ? 'Désarchiver' : 'Archiver'}
              </button>
              <button
                onClick={() => handleDelete(detailApp.id)}
                disabled={busyId === detailApp.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
