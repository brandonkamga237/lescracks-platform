import { useState } from 'react';
import { Check, EyeOff, ExternalLink, RotateCcw, Trash2 } from 'lucide-react';

import { AdminAction, AdminConfirm, AdminPagination, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { SEGMENT, Segmented } from '@/components/admin/viz';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { AdminComment, CommentStatus } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const STATUS: Record<CommentStatus, { label: string; style: string }> = {
  VISIBLE: { label: 'Visible', style: 'border-line text-t3' },
  HIDDEN: { label: 'Masqué', style: 'border-error/30 text-error-ink' },
  DELETED: { label: 'Supprimé par l’auteur', style: 'border-line text-t4' },
};

/**
 * Post-moderation: comments go live at once, the admin reviews what members report. Three reports
 * hide a comment on their own until it is reviewed here.
 */
export default function AdminComments() {
  const [reported, setReported] = useState(true);
  const [page, setPage] = useState(0);
  const list = useApi((signal) => adminApi.comments(reported, page, signal), [reported, page]);
  const [updated, setUpdated] = useState<Record<number, AdminComment>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [erasing, setErasing] = useState<AdminComment | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const comments = (list.data?.content ?? []).map((comment) => updated[comment.id] ?? comment);

  async function moderate(comment: AdminComment, status: 'VISIBLE' | 'HIDDEN') {
    setBusy(comment.id);
    setFailure(null);
    try {
      const saved = await adminApi.moderateComment(comment.id, status);
      setUpdated((current) => ({ ...current, [saved.id]: saved }));
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'La modération a échoué.');
    } finally {
      setBusy(null);
    }
  }

  async function erase() {
    if (!erasing) return;
    setBusy(erasing.id);
    setFailure(null);
    try {
      await adminApi.eraseComment(erasing.id);
      setErasing(null);
      list.reload();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'La suppression a échoué.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminSection title="Commentaires" description="Publiés tout de suite, relus ici. Trois signalements masquent un commentaire en attendant ta décision.">
      <div className="mb-5">
        <Segmented label="Filtre">
          {([[true, 'Signalés'], [false, 'Tous les commentaires']] as const).map(([value, label]) => (
            <button key={label} type="button" aria-pressed={reported === value} onClick={() => { setReported(value); setPage(0); }}
              className={`${SEGMENT} ${reported === value ? 'bg-gold-400 text-black' : 'text-t3 hover:text-t1'}`}>{label}</button>
          ))}
        </Segmented>
      </div>
      {failure && !erasing && <p role="alert" className="mb-4 text-sm text-error-ink">{failure}</p>}

      <AdminState loading={list.loading} error={list.error} empty={!comments.length} onRetry={list.reload}
        emptyMessage={reported ? 'Aucun commentaire signalé. Tout va bien.' : 'Aucun commentaire pour l’instant.'}>
        {comments.map((comment) => (
          <AdminRow key={comment.id}>
            <div className="min-w-0 flex-1 basis-64">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-t1">{comment.author?.name || comment.author?.email || 'Membre supprimé'}</span>
                {comment.author?.email && <span className="truncate text-xs text-t4">{comment.author.email}</span>}
                <span className={`rounded border px-1.5 py-0.5 text-[11px] ${STATUS[comment.status].style}`}>{STATUS[comment.status].label}</span>
                {comment.reportCount > 0 && <span className="rounded bg-error/10 px-1.5 py-0.5 text-[11px] font-medium text-error-ink">{comment.reportCount} signalement{comment.reportCount > 1 ? 's' : ''}</span>}
              </p>
              <p className="mt-2 line-clamp-4 whitespace-pre-line break-words text-sm text-t2">{comment.body}</p>
              {comment.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-t3" aria-label="Motifs des signalements">
                  {comment.reasons.map((reason, index) => <li key={index}>« {reason} »</li>)}
                </ul>
              )}
              <p className="mt-2 text-xs text-t4">
                {comment.parentId ? 'Réponse' : 'Commentaire'} sur « {comment.target?.title ?? 'un contenu supprimé'} » · {dateFormat.format(new Date(comment.createdAt))}{comment.editedAt ? ' · modifié' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Actions de modération">
              {comment.target && <AdminAction icon={ExternalLink} label="Voir" onClick={() => window.open(`${comment.target?.path}#commentaire-${comment.id}`, '_blank', 'noopener')} />}
              {comment.status === 'HIDDEN' && <AdminAction icon={RotateCcw} label="Rétablir" disabled={busy === comment.id} onClick={() => void moderate(comment, 'VISIBLE')} />}
              {comment.status === 'VISIBLE' && comment.reportCount > 0 && <AdminAction icon={Check} label="Garder" disabled={busy === comment.id} onClick={() => void moderate(comment, 'VISIBLE')} />}
              {comment.status === 'VISIBLE' && <AdminAction icon={EyeOff} label="Masquer" danger disabled={busy === comment.id} onClick={() => void moderate(comment, 'HIDDEN')} />}
              <AdminAction icon={Trash2} label="Supprimer" danger disabled={busy === comment.id} onClick={() => setErasing(comment)} />
            </div>
          </AdminRow>
        ))}
        {list.data && list.data.totalPages > 1 && (
          <AdminPagination page={page} totalPages={list.data.totalPages} totalElements={list.data.totalElements} busy={list.loading} onChange={setPage} />
        )}
      </AdminState>

      <AdminConfirm open={Boolean(erasing)} busy={busy === erasing?.id} error={failure} onCancel={() => { setErasing(null); setFailure(null); }} onConfirm={() => void erase()}
        title="Supprimer définitivement ce commentaire ?" description={erasing?.parentId ? 'La réponse disparaît.' : 'Le commentaire et ses réponses disparaissent. Masquer suffit souvent.'} />
    </AdminSection>
  );
}
