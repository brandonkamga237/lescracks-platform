// src/pages/admin/AdminApplications.tsx
import { useState, useEffect } from 'react';
import {
  ClipboardList, Loader2, Trash2, CheckCircle, XCircle,
  Eye, X, Phone, Mail, User, Calendar, MessageSquare,
} from 'lucide-react';
import adminApi, { AdminApplication } from '@/services/adminApi';
import { FUNNEL, ALL_STAGES, stageMeta, nextStage } from '@/lib/applicationPipeline';

const AdminApplications = () => {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [detailApp, setDetailApp] = useState<AdminApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Two populations were being poured into one list: people applying to the
  // Accompagnement 360 (no event) and people signing up for an event. They have
  // nothing to do with each other, so the admin picks one stream at a time.
  const [stream, setStream] = useState<'360' | 'events'>('360');
  const [eventFilter, setEventFilter] = useState<number | 'all'>('all');

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
    if (status === 'ACCEPTED') return;
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

  // Split the two populations. An event registration always carries an eventId; a
  // 360 application never does.
  const is360 = (a: AdminApplication) => a.eventId == null;
  const events360 = applications.filter(is360);
  const eventApps = applications.filter(a => a.eventId != null);

  // Everything below counts only the stream currently on screen, so the 360 funnel
  // is never inflated by event sign-ups and vice-versa.
  const streamApps = stream === '360' ? events360 : eventApps;

  // Distinct events present, for the per-event filter in the events stream.
  const eventsInStream = Array.from(
    new Map(eventApps.filter(a => a.eventId != null)
      .map(a => [a.eventId!, a.eventTitle || `Événement #${a.eventId}`])).entries()
  );

  const scopedApps = stream === 'events' && eventFilter !== 'all'
    ? streamApps.filter(a => a.eventId === eventFilter)
    : streamApps;

  const total = scopedApps.length;
  const countAt = (key: string) => scopedApps.filter(a => a.status === key).length;

  /**
   * The funnel is cumulative, not a headcount per box: someone who has STARTED has,
   * by definition, also been received, reviewed and accepted. Counting only the
   * people sitting in each stage right now would make every rate look catastrophic.
   */
  const reachedStage = (index: number) =>
    scopedApps.filter(a => {
      const i = FUNNEL.findIndex(s => s.key === a.status);
      return i >= index; // REJECTED gives -1, so it never counts as "reached"
    }).length;

  const rejected = countAt('REJECTED');

  const filtered = scopedApps.filter(a =>
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
            {stream === '360'
              ? `${events360.length} candidature${events360.length !== 1 ? 's' : ''} — Accompagnement 360`
              : `${eventApps.length} inscription${eventApps.length !== 1 ? 's' : ''} aux événements`}
          </p>
        </div>
      </div>

      {/* Stream switch — 360 candidates and event registrants are separate worlds. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {([
            { key: '360' as const,    label: 'Accompagnement 360', n: events360.length },
            { key: 'events' as const, label: 'Inscriptions événements', n: eventApps.length },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => { setStream(t.key); setFilterStatus('all'); setEventFilter('all'); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                stream === t.key ? 'bg-gold text-black' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70 tabular-nums">{t.n}</span>
            </button>
          ))}
        </div>

        {/* Which event, when looking at event sign-ups. */}
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
      </div>

      {/* ── Funnel ───────────────────────────────────────────────────────────
          Cumulative: each bar is everyone who reached that stage OR went past it.
          The conversion rate under each step is where you actually lose people. */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Entonnoir de recrutement</h3>
          <p className="text-sm text-gray-500">
            {total} candidature{total !== 1 ? 's' : ''}
            {rejected > 0 && <> · <span className="text-rose-600">{rejected} refusée{rejected !== 1 ? 's' : ''}</span></>}
          </p>
        </div>

        {total === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Aucune candidature pour l'instant. L'entonnoir se remplira dès la première.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {FUNNEL.map((stage, i) => {
              const reached = reachedStage(i);
              const pctOfTotal = total > 0 ? Math.round((reached / total) * 100) : 0;
              const prev = i === 0 ? total : reachedStage(i - 1);
              const conv = prev > 0 ? Math.round((reached / prev) * 100) : 0;

              return (
                <button
                  key={stage.key}
                  onClick={() => setFilterStatus(stage.key)}
                  title={stage.hint}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    filterStatus === stage.key
                      ? 'border-gold bg-gold/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                    <span className="text-xs font-medium text-gray-600 truncate">{stage.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{reached}</p>

                  {/* volume bar */}
                  <div className="mt-2 h-1 rounded bg-gray-100 overflow-hidden">
                    <div className={`h-full ${stage.dot}`} style={{ width: `${pctOfTotal}%` }} />
                  </div>

                  {/* the number that matters: how many survived the PREVIOUS step */}
                  <p className="mt-1.5 text-[11px] text-gray-400 tabular-nums">
                    {i === 0 ? `${pctOfTotal}% du total` : `${conv}% depuis ${FUNNEL[i - 1].label.toLowerCase()}`}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters — every stage, generated from the pipeline definition */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'Toutes' }, ...ALL_STAGES.map(s => ({ key: s.key, label: s.label }))].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s.key
                ? 'bg-gold text-black'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
            {s.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60 tabular-nums">{countAt(s.key)}</span>
            )}
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
                  {stream === 'events' && (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Événement</th>
                  )}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">WhatsApp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(app => {
                  const statusInfo = stageMeta(app.status);
                  const next = nextStage(app.status);
                  const canDelete = app.status !== 'ACCEPTED';

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{displayName(app)}</p>
                        {app.age && <p className="text-xs text-gray-400">{app.age} ans</p>}
                      </td>
                      {stream === 'events' && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {app.eventTitle || <span className="text-gray-300 italic">—</span>}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-600">{displayEmail(app)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.whatsappNumber || <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusInfo.chip}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
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
                            <button
                              onClick={() => setDetailApp(app)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Voir la candidature"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Advance ONE step. Jumping straight to "accepted" is what
                                destroyed the funnel before: nothing was ever recorded in
                                between, so drop-off was invisible. */}
                            {next && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, next.key)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                title={`Faire avancer : ${next.label} — ${next.hint}`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {next.label}
                              </button>
                            )}

                            {app.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                                title="Refuser"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

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
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${stageMeta(detailApp.status).chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stageMeta(detailApp.status).dot}`} />
                  {stageMeta(detailApp.status).label}
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
              {/* Advance one stage, so the funnel records where the candidate actually is. */}
              {nextStage(detailApp.status) && (
                <button
                  onClick={() => handleStatusUpdate(detailApp.id, nextStage(detailApp.status)!.key)}
                  disabled={updatingId === detailApp.id}
                  title={nextStage(detailApp.status)!.hint}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {updatingId === detailApp.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  Passer à « {nextStage(detailApp.status)!.label} »
                </button>
              )}
              {detailApp.status !== 'REJECTED' && (
                <button
                  onClick={() => handleStatusUpdate(detailApp.id, 'REJECTED')}
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
