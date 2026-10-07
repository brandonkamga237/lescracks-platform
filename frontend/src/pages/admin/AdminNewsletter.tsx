import { useRef, useState } from 'react';
import { Clock, Download, Mail, Send, User } from 'lucide-react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import BlockEditor, { type BlockEditorHandle } from '@/components/admin/BlockEditor';
import { ArticleBlocks } from '@/components/resources/ArticleRenderer';

import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { AdminSubscriber, ArticleBlock } from '@/services/types';

const statusLabels = { SUBSCRIBED: 'Abonné', UNSUBSCRIBED: 'Désabonné' };

const SAMPLE: Record<string, string> = {
  '{{firstName}}': 'Marie',
  '{{lastName}}': 'Kamga',
  '{{email}}': 'marie@example.com',
};

/** Replaces personalisation tokens with sample values so the preview reads naturally. */
function sample(blocks: ArticleBlock[]): ArticleBlock[] {
  const fill = (text: string) => Object.entries(SAMPLE).reduce((t, [k, v]) => t.split(k).join(v), text);
  return blocks.map((block) => {
    if ('text' in block) return { ...block, text: fill(block.text ?? '') };
    if (block.type === 'list') return { ...block, items: block.items.map((i) => ({ text: fill(i.text) })) };
    return block;
  });
}

function hasBody(blocks: ArticleBlock[]) {
  return blocks.some((block) => {
    if (block.type === 'image' || block.type === 'link') return !!block.url;
    if (block.type === 'list') return block.items.some((item) => item.text.trim());
    return 'text' in block && block.text.trim().length > 0;
  });
}

export default function AdminNewsletter() {
  const [filter, setFilter] = useState<'' | 'SUBSCRIBED' | 'UNSUBSCRIBED'>('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyBroadcast, setBusyBroadcast] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<ArticleBlock[]>([{ type: 'paragraph', text: '' }]);
  const editorRef = useRef<BlockEditorHandle>(null);

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

  function insertVariable(variable: string) {
    editorRef.current?.insertText(variable);
  }

  async function broadcast(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!subject.trim() || !hasBody(blocks)) {
      setError('Renseigne un objet et un message.');
      return;
    }
    setBusyBroadcast(true);
    try {
      const count = await adminApi.newsletterBroadcast(subject.trim(), blocks);
      setNotice(`Campagne envoyée à ${count} abonné${count > 1 ? 's' : ''}.`);
      setSubject('');
      setBlocks([{ type: 'paragraph', text: '' }]);
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
      {error && <p role="alert" className="mb-5 rounded-lg border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-lg border border-success/25 bg-success/5 p-3 text-sm text-success-ink">{notice}</p>}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line-soft bg-card p-5">
          <p className="text-xs tracking-wide text-t4">Abonnés</p>
          <p className="mt-2 font-display text-2xl font-semibold text-t1">{stats.data?.subscribed ?? '…'}</p>
        </div>
        <div className="rounded-lg border border-line-soft bg-card p-5">
          <p className="text-xs tracking-wide text-t4">Désabonnés</p>
          <p className="mt-2 font-display text-2xl font-semibold text-t1">{stats.data?.unsubscribed ?? '…'}</p>
        </div>
        <div className="rounded-lg border border-line-soft bg-card p-5">
          <p className="text-xs tracking-wide text-t4">Campagnes envoyées</p>
          <p className="mt-2 font-display text-2xl font-semibold text-t1">{campaigns.data?.length ?? '…'}</p>
        </div>
      </div>

      <form onSubmit={broadcast} className="mb-10 rounded-lg border border-line-soft bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-t1">Envoyer une campagne</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-t4">
              Tu écris seulement le corps du message — l’en-tête LesCracks et le pied de page
              (contacts, devise, liens) sont appliqués automatiquement.
            </p>
          </div>
          <button type="submit" disabled={busyBroadcast} className="btn-primary shrink-0">
            {busyBroadcast ? 'Envoi…' : <><Send className="h-4 w-4" aria-hidden /> Envoyer aux abonnés</>}
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="broadcast-subject" className="text-sm font-medium text-t2">Objet de l’email</label>
          <input id="broadcast-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200} className="input mt-2" placeholder="Le sujet que les abonnés verront dans leur boîte" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-t2">Corps du message</p>
            <BlockEditor ref={editorRef} value={blocks} onChange={setBlocks} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-t4">Insérer une variable :</span>
              {[
                { token: '{{firstName}}', label: 'Prénom', icon: User },
                { token: '{{lastName}}', label: 'Nom', icon: User },
                { token: '{{email}}', label: 'Email', icon: Mail },
              ].map(({ token, label, icon: Icon }) => (
                <button key={token} type="button" onClick={() => insertVariable(token)}
                  className="inline-flex items-center gap-1 rounded border border-line-soft bg-noir-950 px-3 py-1.5 text-xs font-medium text-t3 transition-colors hover:border-gold-400/30 hover:text-gold-ink">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </div>

          <div aria-label="Aperçu de l’email">
            <p className="mb-3 text-sm font-medium text-t2">Aperçu <span className="font-normal text-t4">— tel que reçu</span></p>
            <div className="rounded-lg bg-[#0a0a0a] p-4 sm:p-6">
              <div className="overflow-hidden rounded-lg bg-[#141414]">
                <div className="h-[3px] bg-gold-400" aria-hidden />
                <div className="px-6 pb-6 pt-8 text-center sm:px-10">
                  <p className="font-display text-lg font-bold uppercase tracking-[0.22em] text-gold-ink">LesCracks</p>
                  <p className="mt-2 text-[11px] uppercase tracking-widest text-t4">Ressources · Événements · Communauté</p>
                </div>
                <div className="px-6 pb-10 sm:px-10">
                  {hasBody(blocks)
                    ? <ArticleBlocks blocks={sample(blocks)} />
                    : <p className="py-8 text-center text-sm text-t4">Le corps du message apparaîtra ici.</p>}
                </div>
                <div className="border-t border-line-soft bg-[#101010] px-6 py-6 text-center sm:px-10">
                  <p className="text-xs">
                    <span className="font-semibold uppercase tracking-wider text-gold-ink">lescracks.com</span>
                    <span className="mx-2 text-t4">·</span>
                    <span className="text-t3">Événements</span>
                    <span className="mx-2 text-t4">·</span>
                    <span className="text-t3">Ressources</span>
                  </p>
                  <p className="mt-3 text-xs italic text-gold-ink">Deviens aussi un crack de la tech.</p>
                  <p className="mt-3 text-[11px] leading-relaxed text-t4">
                    Tu reçois cet email parce que tu es inscrit à la lettre LesCracks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="grid gap-8 lg:grid-cols-2">
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
                  className={`inline-flex shrink-0 rounded border px-2.5 py-1 text-xs font-medium ${s.status === 'SUBSCRIBED' ? 'border-success/30 bg-success/10 text-success-ink' : 'border-line bg-noir-800 text-t3'}`}
                >
                  {statusLabels[s.status]}
                </span>
                <button
                  type="button"
                  disabled={busyId === s.userId}
                  onClick={() => void toggle(s)}
                  className={`inline-flex min-h-11 items-center rounded border px-3 text-xs font-medium transition-colors disabled:opacity-50 sm:min-h-9 ${s.status === 'SUBSCRIBED' ? 'border-error/30 text-error-ink hover:bg-error/10' : 'border-success/30 text-success-ink hover:bg-success/10'}`}
                >
                  {s.status === 'SUBSCRIBED' ? 'Désabonner' : 'Réabonner'}
                </button>
              </AdminRow>
            ))}
          </AdminState>
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-t1">Historique des campagnes</h2>
          <AdminState
            loading={campaigns.loading}
            error={campaigns.error}
            empty={!(campaigns.data ?? []).length}
            emptyMessage="Aucune campagne envoyée pour le moment."
            onRetry={campaigns.reload}
          >
            {(campaigns.data ?? []).map((c) => (
              <AdminRow key={c.id}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-noir-800 text-gold-ink">
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
      </div>
    </AdminSection>
  );
}
