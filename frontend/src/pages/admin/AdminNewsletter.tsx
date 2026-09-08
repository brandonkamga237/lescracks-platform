import { useState } from 'react';
import { Clock, Download, Send } from 'lucide-react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { AdminSubscriber } from '@/services/types';

const statusLabels = { SUBSCRIBED: 'Abonné', UNSUBSCRIBED: 'Désabonné' };

export default function AdminNewsletter() {
  const [filter, setFilter] = useState<'' | 'SUBSCRIBED' | 'UNSUBSCRIBED'>('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyBroadcast, setBusyBroadcast] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const stats = useApi((signal) => adminApi.newsletterStats(signal), []);
  const subscriptions = useApi((signal) => adminApi.newsletterSubscriptions(filter, signal), [filter]);
  const campaigns = useApi((signal) => adminApi.newsletterCampaigns(signal), []);

  async function toggle(subscriber: AdminSubscriber) {
    setBusyId(subscriber.userId);
    setError('');
    setNotice('');
    try {
      await (subscriber.status === 'SUBSCRIBED'
        ? adminApi.newsletterUnsubscribe(subscriber.userId)
        : adminApi.newsletterSubscribe(subscriber.userId));
      setNotice(`${subscriber.email} a été ${subscriber.status === 'SUBSCRIBED' ? 'désabonné' : 'abonné'}.`);
      await subscriptions.reload();
      await stats.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’action a échoué.');
    } finally {
      setBusyId(null);
    }
  }

  async function broadcast(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!subject.trim() || !message.trim()) {
      setError('Renseigne un objet et un message.');
      return;
    }
    setBusyBroadcast(true);
    try {
      const count = await adminApi.newsletterBroadcast(subject.trim(), message.trim());
      setNotice(`Campagne envoyée à ${count} abonné${count > 1 ? 's' : ''}.`);
      setSubject('');
      setMessage('');
      await campaigns.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’envoi a échoué.');
    } finally {
      setBusyBroadcast(false);
    }
  }

  const list = subscriptions.data ?? [];

  return (
    <AdminSection
      title="Newsletter"
      description="Abonnés, désabonnements et campagnes personnalisées."
      action={
        <button
          type="button"
          onClick={() => void adminApi.exportNewsletter()}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Download className="h-4 w-4" aria-hidden /> Export CSV
        </button>
      }
    >
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-sm text-green-400">{notice}</p>}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/[0.06] bg-card p-5">
          <p className="text-xs tracking-wide text-t4">Abonnés</p>
          <p className="mt-2 font-display text-2xl font-semibold text-t1">{stats.data?.subscribed ?? '—'}</p>
        </div>
        <div className="rounded-3xl border border-white/[0.06] bg-card p-5">
          <p className="text-xs tracking-wide text-t4">Désabonnés</p>
          <p className="mt-2 font-display text-2xl font-semibold text-t1">{stats.data?.unsubscribed ?? '—'}</p>
        </div>
        <div className="rounded-3xl border border-white/[0.06] bg-card p-5">
          <p className="text-xs tracking-wide text-t4">Campagnes envoyées</p>
          <p className="mt-2 font-display text-2xl font-semibold text-t1">{campaigns.data?.length ?? '—'}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-t1">Abonnements</h2>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
              className="input w-auto"
            >
              <option value="">Tous</option>
              <option value="SUBSCRIBED">Abonnés</option>
              <option value="UNSUBSCRIBED">Désabonnés</option>
            </select>
          </div>

          <AdminState
            loading={subscriptions.loading}
            error={subscriptions.error}
            empty={!list.length}
            emptyMessage="Aucun abonnement."
            onRetry={subscriptions.reload}
          >
            {list.map((s) => (
              <AdminRow key={s.userId}>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-display font-medium text-t1">{s.email}</p>
                  <p className="mt-1 text-xs text-t3">{[s.firstName, s.lastName].filter(Boolean).join(' ')}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${s.status === 'SUBSCRIBED' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-t3/30 bg-t3/10 text-t3'}`}
                >
                  {statusLabels[s.status]}
                </span>
                <button
                  type="button"
                  disabled={busyId === s.userId}
                  onClick={() => void toggle(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${s.status === 'SUBSCRIBED' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                >
                  {s.status === 'SUBSCRIBED' ? 'Désabonner' : 'Réabonner'}
                </button>
              </AdminRow>
            ))}
          </AdminState>
        </div>

        <form onSubmit={broadcast} className="rounded-3xl border border-white/[0.06] bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-t1">Envoyer une campagne</h2>
          <p className="mt-2 text-sm text-t4">Message personnalisé aux abonnés. Variables : {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="broadcast-subject" className="text-sm font-medium text-t2">Objet</label>
              <input id="broadcast-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200} className="input mt-2" />
            </div>
            <div>
              <label htmlFor="broadcast-message" className="text-sm font-medium text-t2">Message</label>
              <textarea id="broadcast-message" value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={10000} rows={8} className="input mt-2 h-auto py-3" />
            </div>
            <button type="submit" disabled={busyBroadcast} className="btn-primary w-full">
              {busyBroadcast ? 'Envoi…' : <><Send className="h-4 w-4" aria-hidden /> Envoyer</>}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-t1">Historique des campagnes</h2>
        <AdminState
          loading={campaigns.loading}
          error={campaigns.error}
          empty={!(campaigns.data ?? []).length}
          emptyMessage="Aucune campagne envoyée pour le moment."
          onRetry={campaigns.reload}
        >
          {(campaigns.data ?? []).map((c) => (
            <AdminRow key={c.id}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-noir-800 text-gold-400">
                <Clock className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-display font-medium text-t1">{c.subject}</p>
                <p className="mt-1 text-xs text-t3">{new Date(c.sentAt).toLocaleString('fr-FR')}</p>
              </div>
              <span className="text-sm text-t3">{c.recipientCount} destinataire{c.recipientCount > 1 ? 's' : ''}</span>
            </AdminRow>
          ))}
        </AdminState>
      </div>
    </AdminSection>
  );
}
