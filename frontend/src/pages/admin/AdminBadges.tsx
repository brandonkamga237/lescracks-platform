import { useState, type FormEvent } from 'react';
import { Gift, Pencil, Plus, Trash2, Users } from 'lucide-react';

import { AdminAction, AdminConfirm, AdminModal, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import BadgeIcon from '@/components/recognition/BadgeIcon';
import { useApi } from '@/hooks/useApi';
import { BADGE_ICONS } from '@/lib/badgeIcons';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminBadge, BulkAwardResult } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

/** How rare a badge is: a share of members rounded so a handful never reads as 0 %. */
function rarity(holders: number, members: number) {
  const share = (holders / members) * 100;
  if (holders === 0) return 'personne encore';
  return share < 1 ? 'moins de 1 % des membres' : `${Math.round(share)} % des membres`;
}

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
  onDone: (result: BulkAwardResult) => void;
  onCancel: () => void;
}

type Audience = 'emails' | 'event';

/** One member, a pasted list, or everyone of an event: each new holder gets an email. */
function AwardForm({ badge, onDone, onCancel }: AwardFormProps) {
  const [audience, setAudience] = useState<Audience>('emails');
  const [emails, setEmails] = useState('');
  const [eventId, setEventId] = useState('');
  const [presentOnly, setPresentOnly] = useState(true);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const events = useApi((signal) => audience === 'event' ? adminApi.events(0, signal) : Promise.resolve(null), [audience]);
  const list = emails.split(/[\s,;]+/).map((email) => email.trim()).filter(Boolean);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      onDone(await adminApi.awardBadgeToMany(badge.id, {
        emails: audience === 'emails' ? list : [],
        eventId: audience === 'event' && eventId ? Number(eventId) : undefined,
        presentOnly,
        reason: reason.trim() || undefined,
      }));
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’attribution a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminModal open onClose={onCancel} title={`Attribuer « ${badge.name} »`}
      description="Chaque nouveau membre reçoit un email et voit le badge sur son profil. Ceux qui l’ont déjà ne sont pas touchés." busy={busy}>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="À qui">
            {([['emails', 'Par email'], ['event', 'Aux participants d’un événement']] as Array<[Audience, string]>).map(([value, label]) => (
              <button key={value} type="button" role="radio" aria-checked={audience === value} onClick={() => setAudience(value)}
                className={`min-h-11 rounded border px-3 text-sm transition-colors ${audience === value ? 'border-gold-400 bg-gold-400/10 font-semibold text-gold-ink' : 'border-line text-t3 hover:text-t1'}`}>
                {label}
              </button>
            ))}
          </div>
          {audience === 'emails' ? (
            <label className="block text-sm text-t2">Un ou plusieurs emails <span className="text-t4">(un par ligne, ou séparés par des virgules)</span>
              <textarea required rows={4} value={emails} onChange={(event) => setEmails(event.target.value)} className="input mt-2"
                placeholder={'awa@example.com\nkofi@example.com'} />
              {list.length > 1 && <span className="mt-1 block text-xs text-t4">{list.length} adresses</span>}
            </label>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm text-t2">Événement
                <select required value={eventId} onChange={(event) => setEventId(event.target.value)} className="input mt-2">
                  <option value="">Choisir…</option>
                  {events.data?.content.map((item) => (
                    <option key={item.id} value={item.id}>{item.title} · {item.registrationCount} inscrit{item.registrationCount > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-t2">
                <input type="checkbox" checked={presentOnly} onChange={(event) => setPresentOnly(event.target.checked)} className="h-4 w-4 accent-[#d4af37]" />
                Seulement les personnes pointées « Présent »
              </label>
            </div>
          )}
          <label className="block text-sm text-t2">Motif <span className="text-t4">(facultatif, visible sur le profil et dans l’email)</span>
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
function describe(result: BulkAwardResult) {
  const parts = [`${result.awarded} membre${result.awarded > 1 ? 's ont' : ' a'} reçu le badge (email envoyé)`];
  if (result.alreadyHeld) parts.push(`${result.alreadyHeld} l’avai${result.alreadyHeld > 1 ? 'ent' : 't'} déjà`);
  if (result.unknownEmails.length) parts.push(`aucun compte pour : ${result.unknownEmails.join(', ')}`);
  return `${parts.join(' · ')}.`;
}

export default function AdminBadges() {
  const badges = useApi((signal) => adminApi.badges(signal), []);
  const overview = useApi((signal) => adminApi.overview(signal), []);
  const members = overview.data?.users ?? 0;
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
              <p className="mt-1 text-xs text-t4">
                {badge.holders.toLocaleString('fr-FR')} membre{badge.holders > 1 ? 's' : ''}
                {members > 0 && <span className="ml-1.5 text-gold-ink">· {rarity(badge.holders, members)}</span>}
              </p>
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
        onDone={(result) => { setAwarding(null); setNotice(`« ${awarding.name} » : ${describe(result)}`); badges.reload(); }} />}
      {viewing && <Holders badge={viewing} onClose={() => setViewing(null)} onChanged={badges.reload} />}
      <AdminConfirm open={Boolean(removing)} busy={busy} error={failure} onCancel={() => { setRemoving(null); setFailure(null); }} onConfirm={() => void remove()}
        title={`Supprimer « ${removing?.name ?? ''} » ?`} description="Le badge disparaît de tous les profils qui le portent." />
    </AdminSection>
  );
}
