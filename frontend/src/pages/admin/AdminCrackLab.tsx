import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ClipboardCheck, FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';

import { AdminAction, AdminConfirm, AdminRow, AdminSection, AdminState, ScheduledBadge } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { DIFFICULTY_LABEL, challengePath } from '@/lib/cracklab';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminChallenge, ChallengeStatus } from '@/services/types';

const STATUS_LABEL: Record<ChallengeStatus, string> = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };

/** CrackLab back office: the challenges, with how many answers each has and how many wait for a grade. */
export default function AdminCrackLab() {
  const navigate = useNavigate();
  const challenges = useApi((signal) => adminApi.cracklab.challenges(0, signal), []);
  const list = challenges.data?.content ?? [];
  const [pending, setPending] = useState<AdminChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const waiting = list.reduce((sum, challenge) => sum + challenge.pendingCount, 0);

  async function remove(challenge: AdminChallenge) {
    setBusy(true);
    setFailure(null);
    try {
      await adminApi.cracklab.remove(challenge.id);
      setPending(null);
      setNotice('Le challenge a été supprimé.');
      challenges.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'La suppression a échoué. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminSection
      title="CrackLab"
      description="Les challenges d’ingénierie : un énoncé, une grille de notation, des réponses à noter."
      action={<div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/cracklab/reponses" className="btn-secondary"><ClipboardCheck className="h-4 w-4" aria-hidden />À noter{waiting > 0 && ` (${waiting})`}</Link>
        <Link to="/admin/cracklab/challenges/nouveau" className="btn-primary"><Plus className="h-4 w-4" aria-hidden />Nouveau challenge</Link>
      </div>}
    >
      {notice && <p role="status" className="mb-5 text-sm text-gold-ink">{notice}</p>}
      <AdminState loading={challenges.loading} error={challenges.error} empty={!list.length} emptyMessage="Aucun challenge pour l’instant. Écris le premier énoncé." onRetry={challenges.reload}>
        {list.map((challenge) => (
          <AdminRow key={challenge.id}>
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded bg-noir-800 text-gold-ink sm:flex"><FlaskConical className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0 flex-1 basis-48">
              <h2 className="break-words text-base font-semibold leading-snug tracking-normal text-t1 sm:text-lg">{challenge.title}</h2>
              <p className="mt-1 text-xs text-t3">{challenge.category} · {DIFFICULTY_LABEL[challenge.difficulty]} · {challenge.criteria.length} critères, {challenge.totalPoints} pts</p>
              <p className="mt-1 text-xs text-t4">
                {challenge.submissionCount} réponse{challenge.submissionCount > 1 ? 's' : ''}
                {challenge.pendingCount > 0 && <> · <Link to={`/admin/cracklab/reponses?challenge=${challenge.id}`} className="text-gold-ink underline-offset-4 hover:underline">{challenge.pendingCount} à noter</Link></>}
              </p>
            </div>
            {challenge.status === 'DRAFT' && challenge.scheduledAt ? <ScheduledBadge scheduledAt={challenge.scheduledAt} />
              : <span className={`inline-flex shrink-0 rounded border px-3 py-1 text-xs font-medium ${challenge.status === 'PUBLISHED' ? 'border-gold-400/30 bg-gold-400/10 text-gold-ink' : 'border-line-soft bg-noir-800 text-t3'}`}>{STATUS_LABEL[challenge.status]}</span>}
            <div className="flex gap-2" role="group" aria-label={`Actions pour ${challenge.title}`}>
              <AdminAction icon={Pencil} label="Modifier" onClick={() => navigate(`/admin/cracklab/challenges/${challenge.id}`)} />
              {challenge.status === 'PUBLISHED' && <AdminAction icon={ArrowUpRight} label="Voir" onClick={() => window.open(challengePath(challenge.slug), '_blank', 'noopener')} />}
              {challenge.submissionCount === 0 && <AdminAction icon={Trash2} label="Supprimer" danger onClick={() => { setFailure(null); setPending(challenge); }} />}
            </div>
          </AdminRow>
        ))}
      </AdminState>
      <AdminConfirm
        open={!!pending}
        title="Supprimer ce challenge ?"
        description={pending ? `« ${pending.title} » sera supprimé définitivement, avec sa grille.` : ''}
        busy={busy}
        error={failure}
        onCancel={() => { setPending(null); setFailure(null); }}
        onConfirm={() => { if (pending) void remove(pending); }}
      />
    </AdminSection>
  );
}
