import { useState } from 'react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { ApplicationStatus } from '@/services/types';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/**
 * Deciding candidatures.
 *
 * Accepting records the decision and nothing else. Turning it into a participation is a
 * separate, deliberate act on the next screen — because an application with no account
 * behind it cannot become one, and learning that after the click is worse than before.
 */
export default function AdminApplications() {
  const [status, setStatus] = useState<ApplicationStatus>('PENDING');
  const [busy, setBusy] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const applications = useApi((signal) => adminApi.applications({ status }, signal), [status]);
  const list = applications.data?.content ?? [];

  async function decide(id: number, outcome: 'ACCEPTED' | 'REJECTED') {
    setBusy(id);
    setFailure(null);
    try {
      await adminApi.decide(id, outcome);
      applications.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'La décision n’a pas pu être enregistrée.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminSection
      title="Candidatures"
      description="Accepter enregistre la décision. L’inscription se fait ensuite, dans Participations."
    >
      <div className="mb-6 flex gap-5 border-b border-line-soft pb-3 text-sm">
        {(['PENDING', 'ACCEPTED', 'REJECTED'] as ApplicationStatus[]).map((option) => (
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
        loading={applications.loading}
        error={applications.error}
        empty={list.length === 0}
        emptyMessage="Aucune candidature dans cet état."
        onRetry={applications.reload}
      >
        {list.map((application) => (
          <AdminRow key={application.id}>
            <div className="min-w-0 flex-1">
              <p className="text-t1">{application.fullName}</p>
              <p className="mt-0.5 truncate text-sm text-t4">
                {application.email}
                {application.phone && ` · ${application.phone}`}
              </p>
              <p className="mt-1 text-sm text-t3">
                {application.eventTitle ?? 'Accompagnement 360'} ·{' '}
                {dateFormat.format(new Date(application.createdAt))}
                {!application.hasAccount && (
                  <span className="ml-2 text-t4">· aucun compte rattaché</span>
                )}
              </p>
              {application.motivation && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-t3">
                  {application.motivation}
                </p>
              )}
            </div>

            {application.status === 'PENDING' ? (
              <div className="flex shrink-0 gap-3 text-sm">
                <button
                  type="button"
                  disabled={busy === application.id}
                  onClick={() => void decide(application.id, 'ACCEPTED')}
                  className="rounded-full bg-gold-400 px-4 py-1.5 font-medium text-black disabled:opacity-50"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  disabled={busy === application.id}
                  onClick={() => void decide(application.id, 'REJECTED')}
                  className="rounded-full border border-line px-4 py-1.5 text-t2 disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            ) : (
              <span className="shrink-0 text-sm text-t4">
                {STATUS_LABEL[application.status]}
                {application.decidedAt && ` le ${dateFormat.format(new Date(application.decidedAt))}`}
              </span>
            )}
          </AdminRow>
        ))}
      </AdminState>
    </AdminSection>
  );
}
