import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Eye } from 'lucide-react';

import FilterChips from '@/components/common/FilterChips';
import { AdminAction, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import type { SubmissionStatus } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const TABS: Array<[SubmissionStatus, string]> = [['GRADED', 'Notées']];

/** The grading queue: oldest pending answers first, so nobody waits longest. */
export default function AdminCrackLabQueue() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status: SubmissionStatus = params.get('statut') === 'notees' ? 'GRADED' : 'SUBMITTED';
  const challengeParam = params.get('challenge');
  const challengeId = challengeParam && /^\d+$/.test(challengeParam) ? Number(challengeParam) : undefined;
  const queue = useApi((signal) => adminApi.cracklab.submissions({ status, challengeId }, signal), [status, challengeId]);
  const list = queue.data?.content ?? [];

  return (
    <AdminSection title="À noter" description="Les réponses des membres, notées critère par critère avec la grille du challenge.">
      <div className="mb-6">
        <FilterChips
          legend="Réponses"
          allLabel="En attente"
          options={TABS}
          value={status === 'GRADED' ? 'GRADED' : undefined}
          onChange={(value) => { const next = new URLSearchParams(params); if (value) next.set('statut', 'notees'); else next.delete('statut'); setParams(next); }}
        />
      </div>
      <AdminState loading={queue.loading} error={queue.error} empty={!list.length}
        emptyMessage={status === 'SUBMITTED' ? 'Aucune réponse en attente. Tout est noté.' : 'Aucune réponse notée pour l’instant.'} onRetry={queue.reload}>
        {list.map((submission) => (
          <AdminRow key={submission.id}>
            <div className="min-w-0 flex-1 basis-48">
              <h2 className="break-words text-base font-semibold leading-snug tracking-normal text-t1 sm:text-lg">{submission.challengeTitle}</h2>
              <p className="mt-1 text-xs text-t3">{submission.author.displayName} · {dateFormat.format(new Date(submission.createdAt))} · {submission.wordCount} mots</p>
            </div>
            {submission.status === 'GRADED' && <span className="shrink-0 text-sm font-semibold tabular-nums text-gold-ink">{submission.technicalScore} / {submission.totalPoints}</span>}
            <AdminAction icon={submission.status === 'GRADED' ? Eye : ClipboardCheck} label={submission.status === 'GRADED' ? 'Revoir' : 'Noter'} onClick={() => navigate(`/admin/cracklab/reponses/${submission.id}`)} />
          </AdminRow>
        ))}
      </AdminState>
    </AdminSection>
  );
}
