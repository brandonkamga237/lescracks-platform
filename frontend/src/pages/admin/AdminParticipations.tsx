import { useState } from 'react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { ParticipationStatus } from '@/services/types';

const STATUS_LABEL: Record<ParticipationStatus, string> = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminées',
  ABANDONED: 'Interrompues',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/**
 * Who is following what, and who has finished.
 *
 * Completing is what issues an attestation, and it issues exactly one: a second click
 * returns the code that already exists rather than minting another. That matters because
 * the first may already be on somebody's CV.
 */
export default function AdminParticipations() {
  const [status, setStatus] = useState<ParticipationStatus>('IN_PROGRESS');
  const [busy, setBusy] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const participations = useApi(
    (signal) => adminApi.participations({ status }, signal),
    [status],
  );
  const list = participations.data?.content ?? [];

  async function run(id: number, action: 'complete' | 'abandon') {
    setBusy(id);
    setFailure(null);
    try {
      if (action === 'complete') await adminApi.complete(id);
      else await adminApi.abandon(id);
      participations.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’action a échoué.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminSection
      title="Participations"
      description="Marquer une participation terminée délivre l’attestation, une seule fois."
    >
      <div className="mb-6 flex gap-5 border-b border-line-soft pb-3 text-sm">
        {(['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] as ParticipationStatus[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={status === option ? 'text-t1' : 'text-t4 hover:text-t2'}
          >
            {STATUS_LABEL[option]}
          </button>
        ))}
      </div>

      {failure && (
        <p role="alert" className="mb-6 rounded border border-line px-4 py-3 text-t2">
          {failure}
        </p>
      )}

      <AdminState
        loading={participations.loading}
        error={participations.error}
        empty={list.length === 0}
        emptyMessage="Aucune participation dans cet état."
        onRetry={participations.reload}
      >
        {list.map((participation) => (
          <AdminRow key={participation.id}>
            <div className="min-w-0 flex-1">
              <p className="text-t1">{participation.userName ?? 'Sans nom'}</p>
              <p className="mt-0.5 text-sm text-t3">
                {participation.programme}
                {participation.cohort && ` · promotion ${participation.cohort}`}
              </p>
              <p className="mt-1 text-sm text-t4">
                Depuis le {dateFormat.format(new Date(participation.startedAt))}
                {participation.completedAt &&
                  ` · terminé le ${dateFormat.format(new Date(participation.completedAt))}`}
              </p>
              {participation.attestationCode && (
                <p className="mt-1 font-mono text-sm text-gold-400">
                  {participation.attestationCode}
                </p>
              )}
            </div>

            {participation.status === 'IN_PROGRESS' && (
              <div className="flex shrink-0 gap-3 text-sm">
                <button
                  type="button"
                  disabled={busy === participation.id}
                  onClick={() => void run(participation.id, 'complete')}
                  className="rounded-full bg-gold-400 px-4 py-1.5 font-medium text-black disabled:opacity-50"
                >
                  Terminer et attester
                </button>
                <button
                  type="button"
                  disabled={busy === participation.id}
                  onClick={() => void run(participation.id, 'abandon')}
                  className="rounded-full border border-line px-4 py-1.5 text-t2 disabled:opacity-50"
                >
                  Interrompre
                </button>
              </div>
            )}
          </AdminRow>
        ))}
      </AdminState>
    </AdminSection>
  );
}
