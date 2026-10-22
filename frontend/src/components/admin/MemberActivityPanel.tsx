import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarDays, FileCheck2, MessageSquare } from 'lucide-react';

import BadgeIcon from '@/components/recognition/BadgeIcon';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { ProjectStatus, RegistrationStatus } from '@/services/types';

interface MemberActivityPanelProps {
  memberId: number;
  email: string;
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const REGISTRATION_LABEL: Record<RegistrationStatus, string> = { REGISTERED: 'Inscrit', CANCELLED: 'Annulé', ATTENDED: 'Présent', ABSENT: 'Absent' };
const PROJECT_LABEL: Record<ProjectStatus, string> = { SUBMITTED: 'soumis', UNDER_REVIEW: 'en revue', ACCEPTED: 'retenu', REJECTED: 'non retenu' };

/** What the member did on the platform, and their badges, given or taken back from here. */
export default function MemberActivityPanel({ memberId, email }: MemberActivityPanelProps) {
  const activity = useApi((signal) => adminApi.userActivity(memberId, signal), [memberId]);
  const catalogue = useApi((signal) => adminApi.badges(signal), []);
  const [badgeId, setBadgeId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const data = activity.data;
  const held = new Set(data?.badges.map((badge) => badge.badgeId));
  const available = (catalogue.data ?? []).filter((badge) => !held.has(badge.id));

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: success });
      activity.reload();
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof ApiError ? cause.message : 'L’action a échoué.' });
    } finally {
      setBusy(false);
    }
  }

  function award(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!badgeId) return;
    void run(() => adminApi.awardBadge(Number(badgeId), email, reason.trim() || undefined), 'Badge attribué : le membre a reçu un email.')
      .then(() => { setBadgeId(''); setReason(''); });
  }

  if (activity.loading) return <p className="mt-6 text-sm text-t3">Chargement de l’activité…</p>;
  if (activity.error || !data) return <p role="alert" className="mt-6 text-sm text-error-ink">{activity.error?.message ?? 'Activité indisponible.'}</p>;

  return (
    <div className="mt-8 space-y-7 border-t border-line pt-6">
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-t1"><CalendarDays className="h-4 w-4 text-gold-ink" aria-hidden />Événements ({data.events.length})</h3>
        {data.events.length === 0 ? <p className="mt-2 text-sm text-t4">Inscrit à aucun événement.</p> : (
          <ul className="mt-3 space-y-2">
            {data.events.map((item) => (
              <li key={item.id} className="rounded border border-line-soft p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/admin/evenements/${item.id}`} className="link min-w-0 truncate">{item.title}</Link>
                  <span className="text-xs text-t3">{dayFormat.format(new Date(item.startDate))} · {REGISTRATION_LABEL[item.status]}</span>
                </div>
                {item.project && (
                  <p className="mt-1 text-xs text-t3">
                    Projet « {item.project.title} » : {PROJECT_LABEL[item.project.status]}
                    {item.project.rank ? <span className="ml-1 font-semibold text-gold-ink">· classé {item.project.rank}{item.project.rank === 1 ? 'er' : 'e'}</span> : null}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-t1"><Award className="h-4 w-4 text-gold-ink" aria-hidden />Badges ({data.badges.length})</h3>
        {data.badges.length > 0 && (
          <ul className="mt-3 space-y-2">
            {data.badges.map((badge) => (
              <li key={badge.badgeId} className="flex items-center gap-3 rounded border border-line-soft p-3">
                <BadgeIcon icon={badge.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-t1">{badge.name}</p>
                  <p className="truncate text-xs text-t3">{dayFormat.format(new Date(badge.awardedAt))}{badge.reason ? ` · ${badge.reason}` : ''}</p>
                </div>
                <button type="button" disabled={busy} onClick={() => void run(() => adminApi.revokeBadge(badge.badgeId, memberId), 'Badge retiré.')}
                  className="shrink-0 text-xs text-error-ink underline-offset-4 hover:underline disabled:opacity-50">Retirer</button>
              </li>
            ))}
          </ul>
        )}
        {available.length > 0 && (
          <form onSubmit={award} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select aria-label="Badge à attribuer" value={badgeId} onChange={(event) => setBadgeId(event.target.value)} className="input">
              <option value="">Attribuer un badge…</option>
              {available.map((badge) => <option key={badge.id} value={badge.id}>{badge.name}</option>)}
            </select>
            <input aria-label="Motif" maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif (facultatif)" className="input" />
            <button type="submit" disabled={busy || !badgeId} className="btn-primary">Attribuer</button>
          </form>
        )}
        {message && <p role={message.ok ? 'status' : 'alert'} className={`mt-2 text-sm ${message.ok ? 'text-gold-ink' : 'text-error-ink'}`}>{message.text}</p>}
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-t1"><FileCheck2 className="h-4 w-4 text-gold-ink" aria-hidden />Attestations ({data.certificates.length})</h3>
        {data.certificates.length === 0 ? <p className="mt-2 text-sm text-t4">Aucune attestation émise.</p> : (
          <ul className="mt-3 space-y-1.5">
            {data.certificates.map((certificate) => (
              <li key={certificate.code} className="text-sm">
                <Link to={`/attestations/${certificate.code}`} target="_blank" className="link">{certificate.title}</Link>
                <span className="ml-2 text-xs text-t4">{dayFormat.format(new Date(certificate.issuedAt))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-2 text-sm text-t2"><MessageSquare className="h-4 w-4 text-gold-ink" aria-hidden />{data.comments.toLocaleString('fr-FR')} commentaire{data.comments > 1 ? 's' : ''} écrit{data.comments > 1 ? 's' : ''}</p>
    </div>
  );
}
