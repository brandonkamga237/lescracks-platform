import { useState } from 'react';
import { Clock, Download, Mail, Send } from 'lucide-react';

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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-t1">Newsletter</h1>
          <p className="mt-1 text-sm text-t4">Abonnés, désabonnements et campagnes personnalisées.</p>
        </div>
        <button type="button" onClick={() => void adminApi.exportNewsletter()} className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 px-4 py-3 text-sm text-gold-400 hover:bg-gold-400/10">
          <Download className="h-4 w-4" aria-hidden /> Export CSV
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-t1">Abonnements</h2>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
              className="rounded-xl border border-line-strong bg-background px-3 py-2 text-sm text-t1 outline-none focus:border-gold-400"
            >
              <option value="">Tous</option>
              <option value="SUBSCRIBED">Abonnés</option>
              <option value="UNSUBSCRIBED">Désabonnés</option>
            </select>
          </div>

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
          {notice && <p role="status" className="mb-5 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-sm text-green-400">{notice}</p>}

          {subscriptions.loading ? (
            <p className="py-16 text-center text-t3">Chargement…</p>
          ) : list.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.06] bg-card py-12 text-center">
              <Mail className="mx-auto h-8 w-8 text-t4" aria-hidden />
              <p className="mt-4 text-t3">Aucun abonnement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/[0.06] bg-card">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-line-soft bg-noir-950/50 text-t4">
                  <tr>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Nom</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                    <th className="px-5 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.userId} className="border-b border-line-soft/50 last:border-b-0">
                      <td className="px-5 py-3 text-t1">{s.email}</td>
                      <td className="px-5 py-3 text-t3">{s.firstName} {s.lastName}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${s.status === 'SUBSCRIBED' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-t3/30 bg-t3/10 text-t3'}`}>
                          {statusLabels[s.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          disabled={busyId === s.userId}
                          onClick={() => void toggle(s)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${s.status === 'SUBSCRIBED' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                        >
                          {s.status === 'SUBSCRIBED' ? 'Désabonner' : 'Réabonner'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={broadcast} className="rounded-3xl border border-white/[0.06] bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-t1">Envoyer une campagne</h2>
          <p className="mt-2 text-sm text-t4">Message personnalisé aux abonnés. Variables : {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="broadcast-subject" className="text-sm font-medium text-t2">Objet</label>
              <input id="broadcast-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200} className="mt-2 w-full rounded-xl border border-line-strong bg-background px-4 py-3 text-t1 outline-none focus:border-gold-400" />
            </div>
            <div>
              <label htmlFor="broadcast-message" className="text-sm font-medium text-t2">Message</label>
              <textarea id="broadcast-message" value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={10000} rows={8} className="mt-2 w-full rounded-xl border border-line-strong bg-background px-4 py-3 text-t1 outline-none focus:border-gold-400" />
            </div>
            <button type="submit" disabled={busyBroadcast} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-5 py-3 font-semibold text-noir-950 transition hover:bg-gold-300 disabled:opacity-50">
              {busyBroadcast ? 'Envoi…' : <><Send className="h-4 w-4" aria-hidden /> Envoyer</>}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-t1">Historique des campagnes</h2>
        {campaigns.loading ? <p className="py-8 text-center text-t3">Chargement…</p> : (campaigns.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-t3">Aucune campagne envoyée pour le moment.</p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-3xl border border-white/[0.06] bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line-soft bg-noir-950/50 text-t4">
                <tr>
                  <th className="px-5 py-3 font-medium">Objet</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Destinataires</th>
                </tr>
              </thead>
              <tbody>
                {(campaigns.data ?? []).map((c) => (
                  <tr key={c.id} className="border-b border-line-soft/50 last:border-b-0">
                    <td className="px-5 py-3 text-t1">{c.subject}</td>
                    <td className="px-5 py-3 text-t3"><Clock className="mr-1 inline h-3 w-3" aria-hidden />{new Date(c.sentAt).toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3 text-t3">{c.recipientCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
