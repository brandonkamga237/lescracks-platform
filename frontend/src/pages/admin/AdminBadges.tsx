import { useState, type FormEvent } from 'react';
import { Gift, Pencil, Plus, Trash2, Users } from 'lucide-react';

import { AdminAction, AdminConfirm, AdminModal, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import BadgeIcon from '@/components/recognition/BadgeIcon';
import { useApi } from '@/hooks/useApi';
import { BADGE_ICONS } from '@/lib/badgeIcons';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminBadge } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

type Draft = { name: string; description: string; icon: string };

interface BadgeFormProps {
  initial?: AdminBadge;
  onDone: () => void;
  onCancel: () => void;
}

function BadgeForm({ initial, onDone, onCancel }: BadgeFormProps) {
  const [draft, setDraft] = useState<Draft>({ name: initial?.name ?? '', description: initial?.description ?? '', icon: initial?.icon ?? 'award' });
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      if (initial) await adminApi.updateBadge(initial.id, draft);
      else await adminApi.createBadge(draft);
      onDone();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’enregistrement a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminModal open onClose={onCancel} title={initial ? 'Modifier le badge' : 'Nouveau badge'} description="Le nom et la phrase s’affichent sur les profils." busy={busy}>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <label className="block text-sm text-t2">Nom
            <input required maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="input mt-2" />
          </label>
          <label className="block text-sm text-t2">Ce qu’il récompense
            <input required maxLength={300} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="A aidé d’autres membres pendant le hackathon." className="input mt-2" />
          </label>
          <div>
            <p className="text-sm text-t2">Icône</p>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8" role="radiogroup" aria-label="Icône">
              {Object.entries(BADGE_ICONS).map(([key, Icon]) => (
                <button key={key} type="button" role="radio" aria-checked={draft.icon === key} aria-label={key} onClick={() => setDraft({ ...draft, icon: key })}
                  className={`flex h-11 items-center justify-center rounded border transition-colors ${draft.icon === key ? 'border-gold-400 bg-gold-400/10 text-gold-ink' : 'border-line text-t3 hover:text-t1'}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </button>
              ))}
            </div>
          </div>
          {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{initial ? 'Enregistrer' : 'Créer le badge'}</button>
          </div>
        </fieldset>
      </form>
    </AdminModal>
  );
}

interface AwardFormProps {
  badge: AdminBadge;
  onDone: () => void;
  onCancel: () => void;
}

function AwardForm({ badge, onDone, onCancel }: AwardFormProps) {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      await adminApi.awardBadge(badge.id, email.trim(), reason.trim() || undefined);
      onDone();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’attribution a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminModal open onClose={onCancel} title={`Attribuer « ${badge.name} »`} description="Le badge apparaît aussitôt sur le profil du membre." busy={busy}>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <label className="block text-sm text-t2">Email du membre
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input mt-2" />
          </label>
          <label className="block text-sm text-t2">Motif <span className="text-t4">(facultatif, visible sur le profil)</span>
            <input maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Hackathon 001" className="input mt-2" />
          </label>
          {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Attribuer</button>
          </div>
        </fieldset>
      </form>
    </AdminModal>
  );
}

function Holders({ badge, onClose, onChanged }: { badge: AdminBadge; onClose: () => void; onChanged: () => void }) {
  const holders = useApi((signal) => adminApi.badgeHolders(badge.id, signal), [badge.id]);
  const [busy, setBusy] = useState<number | null>(null);

  async function revoke(userId: number) {
    setBusy(userId);
    try {
      await adminApi.revokeBadge(badge.id, userId);
      holders.reload();
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminModal open onClose={onClose} title={`« ${badge.name} »`} description={`${badge.holders} membre${badge.holders > 1 ? 's' : ''} le portent.`} wide>
      <AdminState loading={holders.loading} error={holders.error} empty={!holders.data?.length} emptyMessage="Personne ne porte encore ce badge." onRetry={holders.reload}>
        <ul className="divide-y divide-line-soft">
          {holders.data?.map((holder) => (
            <li key={holder.userId} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-t1">{holder.name}</p>
                <p className="truncate text-xs text-t3">{holder.email} · {dateFormat.format(new Date(holder.awardedAt))}{holder.reason ? ` · ${holder.reason}` : ''}</p>
              </div>
              <button type="button" disabled={busy === holder.userId} onClick={() => void revoke(holder.userId)}
                className="shrink-0 text-xs text-error-ink underline-offset-4 hover:underline disabled:opacity-50">Retirer</button>
            </li>
          ))}
        </ul>
      </AdminState>
    </AdminModal>
  );
}

/** The badge catalogue: system badges come from rules, custom ones are created and awarded here. */
export default function AdminBadges() {
  const badges = useApi((signal) => adminApi.badges(signal), []);
  const [editing, setEditing] = useState<AdminBadge | 'new' | null>(null);
  const [awarding, setAwarding] = useState<AdminBadge | null>(null);
  const [viewing, setViewing] = useState<AdminBadge | null>(null);
  const [removing, setRemoving] = useState<AdminBadge | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  async function remove() {
    if (!removing) return;
    setBusy(true);
    setFailure(null);
    try {
      await adminApi.deleteBadge(removing.id);
      setRemoving(null);
      badges.reload();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'La suppression a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminSection title="Badges" description="Ce qui s’affiche sur les profils. Les badges système viennent des attestations ; les autres, tu les crées et les attribues."
      action={<button type="button" onClick={() => setEditing('new')} className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" aria-hidden />Nouveau badge</button>}>
      {notice && <p role="status" className="mb-4 text-sm text-gold-ink">{notice}</p>}
      <AdminState loading={badges.loading} error={badges.error} empty={!badges.data?.length} emptyMessage="Aucun badge." onRetry={badges.reload}>
        {badges.data?.map((badge) => (
          <AdminRow key={badge.id}>
            <BadgeIcon icon={badge.icon} />
            <div className="min-w-0 flex-1 basis-48">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-t1">
                {badge.name}
                {badge.system && <span className="rounded border border-line px-1.5 py-0.5 text-[11px] font-normal text-t4">Système</span>}
              </p>
              <p className="mt-0.5 text-xs text-t3">{badge.description}</p>
              <p className="mt-1 text-xs text-t4">{badge.holders.toLocaleString('fr-FR')} membre{badge.holders > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label={`Actions pour ${badge.name}`}>
              <AdminAction icon={Gift} label="Attribuer" onClick={() => setAwarding(badge)} />
              <AdminAction icon={Users} label="Membres" onClick={() => setViewing(badge)} />
              {!badge.system && <AdminAction icon={Pencil} label="Modifier" onClick={() => setEditing(badge)} />}
              {!badge.system && <AdminAction icon={Trash2} label="Supprimer" danger onClick={() => setRemoving(badge)} />}
            </div>
          </AdminRow>
        ))}
      </AdminState>

      {editing && <BadgeForm initial={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)}
        onDone={() => { setEditing(null); setNotice('Badge enregistré.'); badges.reload(); }} />}
      {awarding && <AwardForm badge={awarding} onCancel={() => setAwarding(null)}
        onDone={() => { setAwarding(null); setNotice(`« ${awarding.name} » attribué.`); badges.reload(); }} />}
      {viewing && <Holders badge={viewing} onClose={() => setViewing(null)} onChanged={badges.reload} />}
      <AdminConfirm open={Boolean(removing)} busy={busy} error={failure} onCancel={() => { setRemoving(null); setFailure(null); }} onConfirm={() => void remove()}
        title={`Supprimer « ${removing?.name ?? ''} » ?`} description="Le badge disparaît de tous les profils qui le portent." />
    </AdminSection>
  );
}
