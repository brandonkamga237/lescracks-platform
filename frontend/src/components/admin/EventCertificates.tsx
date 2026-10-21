import { useState } from 'react';
import { Eye, FileCheck2, Loader2, Send, Trash2, Undo2 } from 'lucide-react';

import { AdminAction, AdminConfirm, AdminModal, AdminRow, AdminState } from '@/components/admin/AdminTable';
import CertificateDocument from '@/components/recognition/CertificateDocument';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminCertificate, CertificateKind } from '@/services/types';

const KIND_LABEL: Record<CertificateKind, string> = {
  PARTICIPATION: 'Participation', WINNER: 'Lauréat', PODIUM: 'Podium', AMBASSADOR: 'Ambassadeur',
};

const STATUS_STYLE: Record<AdminCertificate['status'], string> = {
  DRAFT: 'border-line text-t3',
  ISSUED: 'border-gold-400/40 text-gold-ink',
  REVOKED: 'border-error/30 text-error-ink',
};

const STATUS_LABEL: Record<AdminCertificate['status'], string> = { DRAFT: 'Brouillon', ISSUED: 'Émise', REVOKED: 'Révoquée' };

interface EventCertificatesProps {
  eventId: number;
  /** Explains where drafts come from for this event. */
  acceptsSubmissions: boolean;
}

/**
 * Attestations are never automatic: drafts are prepared from the event, previewed one by one,
 * then only the selected ones are issued and emailed.
 */
export default function EventCertificates({ eventId, acceptsSubmissions }: EventCertificatesProps) {
  const list = useApi((signal) => adminApi.eventCertificates(eventId, signal), [eventId]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState<AdminCertificate | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'issue' | 'revoke' | 'discard'; target?: AdminCertificate } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const certificates = list.data ?? [];
  const drafts = certificates.filter((certificate) => certificate.status === 'DRAFT');

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setFailure(null);
    try {
      await action();
      setNotice(message);
      setConfirm(null);
      setSelected(new Set());
      list.reload();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’opération a échoué.');
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <p className="mb-4 text-sm text-t3">
        {acceptsSubmissions
          ? 'Les brouillons reprennent chaque membre d’un projet non rejeté, plus le lauréat (1re place) et le podium (2e et 3e).'
          : 'Les brouillons reprennent les inscrits pointés « présent ».'}
        {' '}Rien n’est envoyé tant que tu n’émets pas.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => void run(() => adminApi.prepareCertificates(eventId), 'Brouillons préparés.')} className="btn-secondary inline-flex items-center gap-2">
          {busy && !confirm ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <FileCheck2 className="h-4 w-4" aria-hidden />}Préparer les brouillons
        </button>
        {drafts.length > 0 && (
          <>
            <button type="button" onClick={() => setSelected(selected.size === drafts.length ? new Set() : new Set(drafts.map((draft) => draft.id)))} className="btn-secondary">
              {selected.size === drafts.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            <button type="button" disabled={!selected.size || busy} onClick={() => setConfirm({ kind: 'issue' })} className="btn-primary inline-flex items-center gap-2">
              <Send className="h-4 w-4" aria-hidden />Émettre ({selected.size})
            </button>
          </>
        )}
      </div>
      {notice && <p role="status" className="mb-4 text-sm text-gold-ink">{notice}</p>}

      <AdminState loading={list.loading} error={list.error} empty={!certificates.length}
        emptyMessage="Aucune attestation pour l’instant : prépare les brouillons." onRetry={list.reload}>
        {certificates.map((certificate) => (
          <AdminRow key={certificate.id}>
            {certificate.status === 'DRAFT' && (
              <input type="checkbox" checked={selected.has(certificate.id)} onChange={() => toggle(certificate.id)}
                aria-label={`Sélectionner ${certificate.holderName}`} className="h-4 w-4 shrink-0 accent-[#d4af37]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-t1">{certificate.holderName}</p>
              <p className="truncate text-xs text-t3">{KIND_LABEL[certificate.kind]}{certificate.email ? ` · ${certificate.email}` : ''}</p>
            </div>
            <span className={`shrink-0 rounded border px-2 py-0.5 text-xs ${STATUS_STYLE[certificate.status]}`}>{STATUS_LABEL[certificate.status]}</span>
            <div className="flex items-center gap-2" role="group" aria-label={`Actions pour ${certificate.holderName}`}>
              <AdminAction icon={Eye} label="Aperçu" onClick={() => setPreview(certificate)} />
              {certificate.status === 'DRAFT' && <AdminAction icon={Trash2} label="Supprimer" danger onClick={() => setConfirm({ kind: 'discard', target: certificate })} />}
              {certificate.status === 'ISSUED' && <AdminAction icon={Undo2} label="Révoquer" danger onClick={() => setConfirm({ kind: 'revoke', target: certificate })} />}
            </div>
          </AdminRow>
        ))}
      </AdminState>

      <AdminModal open={Boolean(preview)} onClose={() => setPreview(null)} title="Aperçu de l’attestation"
        description={preview?.status === 'DRAFT' ? 'Le nom sera relu au moment de l’émission.' : `Code ${preview?.code ?? ''}`} wide>
        {preview && <CertificateDocument certificate={{ ...preview, revoked: preview.status === 'REVOKED' }} draft={preview.status === 'DRAFT'} />}
      </AdminModal>

      <AdminConfirm
        open={Boolean(confirm)}
        busy={busy}
        error={failure}
        onCancel={() => { setConfirm(null); setFailure(null); }}
        title={confirm?.kind === 'issue' ? `Émettre ${selected.size} attestation${selected.size > 1 ? 's' : ''} ?`
          : confirm?.kind === 'revoke' ? 'Révoquer cette attestation ?' : 'Supprimer ce brouillon ?'}
        description={confirm?.kind === 'issue' ? 'Chaque titulaire reçoit un email avec le lien de son attestation. Une attestation émise ne se modifie plus : elle peut seulement être révoquée.'
          : confirm?.kind === 'revoke' ? `${confirm.target?.holderName ?? ''} : la page de vérification indiquera « révoquée ».` : `${confirm?.target?.holderName ?? ''} : le brouillon disparaît, rien n’est envoyé.`}
        label={confirm?.kind === 'issue' ? 'Émettre et envoyer' : confirm?.kind === 'revoke' ? 'Révoquer' : 'Supprimer'}
        onConfirm={() => {
          if (confirm?.kind === 'issue') void run(() => adminApi.issueCertificates([...selected]), 'Attestations émises et envoyées.');
          else if (confirm?.kind === 'revoke' && confirm.target) void run(() => adminApi.revokeCertificate(confirm.target!.id), 'Attestation révoquée.');
          else if (confirm?.target) void run(() => adminApi.discardCertificate(confirm.target!.id), 'Brouillon supprimé.');
        }}
      />
    </div>
  );
}
